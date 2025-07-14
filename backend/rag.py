# backend/rag.py

import os
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader, UnstructuredWordDocumentLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

PERSIST_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_db")
embeddings = OpenAIEmbeddings()

def get_vectordb():
    return Chroma(
        persist_directory=PERSIST_DIR,
        embedding_function=embeddings,
        collection_name="resumes"
    )

def get_retriever(k: int = 3):
    db = get_vectordb()
    return db.as_retriever(search_kwargs={"k": k})

async def ingest_resume(file_path: str, mime: str) -> int:
    # Load & chunk
    loader = PyPDFLoader(file_path) if mime.endswith("pdf") else UnstructuredWordDocumentLoader(file_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    db = get_vectordb()

    # Try to delete the old collection if it exists
    try:
        db.delete_collection("resumes")
    except Exception:
        # ignore if the collection does not yet exist
        pass

    # Add new chunks and persist
    db.add_documents(chunks)
    #db.persist()

    return len(chunks)
