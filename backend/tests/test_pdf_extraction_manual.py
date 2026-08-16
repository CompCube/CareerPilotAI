"""
Prova manual de l'extraccio de PDF -- amb un PDF REAL (no simulat), ja que
aqui no hi ha cap LLM involucrat, nomes parsing local.
"""

import asyncio
import sys

sys.path.insert(0, ".")

from fastapi import UploadFile  # noqa: E402
from starlette.datastructures import Headers  # noqa: E402

from app.utils.pdf_extraction import PDFExtractionError, extract_text_from_pdf  # noqa: E402
from app.utils.validation import FileValidationError, validate_pdf_upload  # noqa: E402


def make_upload_file(path: str, filename: str) -> UploadFile:
    with open(path, "rb") as f:
        content = f.read()
    from io import BytesIO

    return UploadFile(
        file=BytesIO(content),
        filename=filename,
        headers=Headers({"content-type": "application/pdf"}),
    )


async def test_valid_pdf_extracts_real_text():
    upload = make_upload_file("/tmp/sample_cv.pdf", "cv.pdf")
    content = await validate_pdf_upload(upload)
    text = extract_text_from_pdf(content)
    assert "Jordi Altisen" in text
    assert "Shader Graph" in text
    print("OK  test_valid_pdf_extracts_real_text ->", repr(text[:60]))


async def test_fake_pdf_rejected_by_magic_bytes():
    from io import BytesIO

    fake = UploadFile(
        file=BytesIO(b"this is not a pdf, just text pretending to be one"),
        filename="fake.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    try:
        await validate_pdf_upload(fake)
        raise AssertionError("Hauria d'haver rebutjat un fitxer sense magic bytes de PDF")
    except FileValidationError:
        pass
    print("OK  test_fake_pdf_rejected_by_magic_bytes")


async def test_corrupted_pdf_raises_clean_error():
    # Magic bytes correctes pero contingut trencat despres
    from io import BytesIO

    broken = UploadFile(
        file=BytesIO(b"%PDF-1.4\ngarbage garbage garbage not a real pdf structure"),
        filename="broken.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    content = await validate_pdf_upload(broken)  # passa magic bytes, es "prou PDF"
    try:
        extract_text_from_pdf(content)
        raise AssertionError("Hauria d'haver detectat que no es un PDF llegible")
    except PDFExtractionError:
        pass
    print("OK  test_corrupted_pdf_raises_clean_error")


async def main():
    await test_valid_pdf_extracts_real_text()
    await test_fake_pdf_rejected_by_magic_bytes()
    await test_corrupted_pdf_raises_clean_error()
    print("\nTots els tests d'extraccio de PDF han passat.")


if __name__ == "__main__":
    asyncio.run(main())
