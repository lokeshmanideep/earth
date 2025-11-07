import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import type { Placeholder } from "./documentParser";

class DocumentDownloadService {
  /**
   * Generate and download a .docx file with filled placeholders
   */
  async generateAndDownloadDocument(
    originalContent: string,
    placeholders: Placeholder[],
    filename: string = "completed-document.docx"
  ): Promise<void> {
    try {
      // Parse the HTML content and convert to docx format
      const doc = await this.createDocxFromHtml(originalContent, placeholders);

      // Generate the document blob
      const blob = await Packer.toBlob(doc);

      // Download the file
      saveAs(blob, filename);
    } catch (error) {
      console.error("Error generating document:", error);
      throw new Error("Failed to generate document. Please try again.");
    }
  }

  /**
   * Create a docx Document from HTML content with filled placeholders
   */
  private async createDocxFromHtml(
    htmlContent: string,
    placeholders: Placeholder[]
  ): Promise<Document> {
    // Fill placeholders in the content
    let filledContent = htmlContent;
    placeholders.forEach((placeholder) => {
      if (placeholder.value) {
        const escapedOriginal = placeholder.originalText.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );
        const regex = new RegExp(escapedOriginal, "g");
        filledContent = filledContent.replace(regex, placeholder.value);
      }
    });

    // Convert HTML to plain text and parse into paragraphs
    const textContent = this.htmlToText(filledContent);
    const paragraphs = this.parseTextToParagraphs(textContent);

    const doc = new Document({
      sections: [
        {
          children: paragraphs,
        },
      ],
    });

    return doc;
  }

  /**
   * Parse text content into docx paragraphs
   */
  private parseTextToParagraphs(text: string): Paragraph[] {
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const paragraphs: Paragraph[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine === "") {
        return;
      }

      // Check if line looks like a heading (simple heuristic)
      if (this.isHeading(trimmedLine)) {
        const headingLevel = this.getHeadingLevel(trimmedLine);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                bold: true,
                size: this.getHeadingSize(headingLevel),
              }),
            ],
            heading: headingLevel,
            spacing: {
              after: 200,
            },
          })
        );
      } else {
        // Regular paragraph
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 24, // 12pt font
              }),
            ],
            spacing: {
              after: 200,
            },
          })
        );
      }
    });

    return paragraphs;
  }

  /**
   * Simple heuristic to determine if a line is a heading
   */
  private isHeading(line: string): boolean {
    // Check for common heading patterns
    const headingPatterns = [
      /^[A-Z][A-Z\s]+$/, // ALL CAPS
      /^\d+\.\s/, // Numbered (1. 2. 3.)
      /^[A-Z][a-z]+:$/, // Title case ending with colon
      /^[A-Z].*[^.]$/, // Starts with capital and doesn't end with period
    ];

    return (
      headingPatterns.some((pattern) => pattern.test(line.trim())) &&
      line.length < 100
    );
  }

  /**
   * Determine heading level based on content
   */
  private getHeadingLevel(
    line: string
  ): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
    if (/^\d+\.\s/.test(line)) {
      return HeadingLevel.HEADING_2;
    }
    if (/^[A-Z][A-Z\s]+$/.test(line)) {
      return HeadingLevel.HEADING_1;
    }
    return HeadingLevel.HEADING_3;
  }

  /**
   * Get font size based on heading level
   */
  private getHeadingSize(
    level: (typeof HeadingLevel)[keyof typeof HeadingLevel]
  ): number {
    switch (level) {
      case HeadingLevel.HEADING_1:
        return 32; // 16pt
      case HeadingLevel.HEADING_2:
        return 28; // 14pt
      case HeadingLevel.HEADING_3:
        return 26; // 13pt
      default:
        return 24; // 12pt
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    // Create a temporary div to parse HTML
    const div = document.createElement("div");
    div.innerHTML = html;

    // Replace common HTML elements with appropriate text formatting
    const paragraphs = div.querySelectorAll("p");
    paragraphs.forEach((p) => {
      p.insertAdjacentText("afterend", "\n\n");
    });

    const headings = div.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((h) => {
      h.insertAdjacentText("afterend", "\n\n");
    });

    const listItems = div.querySelectorAll("li");
    listItems.forEach((li) => {
      li.insertAdjacentText("beforebegin", "• ");
      li.insertAdjacentText("afterend", "\n");
    });

    const lineBreaks = div.querySelectorAll("br");
    lineBreaks.forEach((br) => {
      br.insertAdjacentText("afterend", "\n");
    });

    return div.textContent || div.innerText || "";
  }

  /**
   * Preview download - return blob for preview purposes
   */
  async generateDocumentBlob(
    originalContent: string,
    placeholders: Placeholder[]
  ): Promise<Blob> {
    const doc = await this.createDocxFromHtml(originalContent, placeholders);
    return await Packer.toBlob(doc);
  }

  /**
   * Validate that document is ready for download
   */
  validateForDownload(placeholders: Placeholder[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    const requiredPlaceholders = placeholders.filter((p) => p.required);
    const unfilledRequired = requiredPlaceholders.filter(
      (p) => !p.value || p.value.trim() === ""
    );

    if (unfilledRequired.length > 0) {
      errors.push(
        `${
          unfilledRequired.length
        } required field(s) are still empty: ${unfilledRequired
          .map((p) => p.label)
          .join(", ")}`
      );
    }

    // Validate filled values
    placeholders.forEach((placeholder) => {
      if (placeholder.value && placeholder.value.trim() !== "") {
        switch (placeholder.type) {
          case "email":
            if (!this.isValidEmail(placeholder.value)) {
              errors.push(
                `${placeholder.label} contains an invalid email address`
              );
            }
            break;
          case "number":
            if (isNaN(Number(placeholder.value))) {
              errors.push(`${placeholder.label} contains an invalid number`);
            }
            break;
          case "date":
            if (!this.isValidDate(placeholder.value)) {
              errors.push(`${placeholder.label} contains an invalid date`);
            }
            break;
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

export default new DocumentDownloadService();
