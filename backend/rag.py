# backend/rag.py

import os
from uuid import uuid4
from langchain_community.document_loaders import PyPDFLoader
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from chromadb import Client
from chromadb.config import Settings
from chromadb.utils import embedding_functions

# Set ChromaDB directory (persistent)
CHROMA_DIR = "./chroma_db"
COLLECTION_NAME = "resumes"

chroma_client = Client(Settings(persist_directory=CHROMA_DIR))

def get_or_create_collection():
    """Returns the resumes collection, creates it if it doesn’t exist."""
    try:
        return chroma_client.get_collection(COLLECTION_NAME)
    except:
        print("⚠️ Collection not found. Creating new collection...")
        return chroma_client.create_collection(name=COLLECTION_NAME)

async def ingest_resume(path: str, content_type: str, candidate_id: str):
    """
    Ingest a PDF resume into ChromaDB using OpenAI embeddings.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Resume file not found at {path}")

    # 1. Load PDF and extract text chunks
    loader = PyPDFLoader(path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_documents(documents)

    # 2. Extract plain text
    texts = [chunk.page_content for chunk in chunks]
    metadatas = [{"candidate_id": candidate_id, "chunk_id": i} for i in range(len(texts))]

    # 3. Embed using OpenAI
    embedder = OpenAIEmbeddings()
    vectors = await embedder.aembed_documents(texts)

    # 4. Save to ChromaDB
    collection = get_or_create_collection()
    ids = [f"{candidate_id}_{i}" for i in range(len(texts))]
    collection.add(documents=texts, metadatas=metadatas, ids=ids, embeddings=vectors)

    print(f"✅ Ingested {len(texts)} resume chunks for {candidate_id}")
    return len(texts)

def get_retriever(candidate_id: str):
    """
    Returns a simple retriever interface to fetch relevant docs.
    """
    collection = get_or_create_collection()

    class SimpleRetriever:
        def get_relevant_documents(self, query: str):
            embedder = OpenAIEmbeddings()
            query_vector = embedder.embed_query(query)
            results = collection.query(query_embeddings=[query_vector], n_results=4)
            return [type("Doc", (), {"page_content": d}) for d in results["documents"][0]]

    return SimpleRetriever()
