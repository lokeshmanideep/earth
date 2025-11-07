import mammoth from "mammoth";

export interface Placeholder {
  id: string;
  label: string;
  originalText: string;
  value?: string;
  type: "text" | "date" | "number" | "email";
  required: boolean;
  description?: string;
}

export interface ParsedDocument {
  content: string;
  placeholders: Placeholder[];
  originalFile: File;
}

class DocumentParserService {
  /**
   * Parse a .docx file and extract content with placeholders
   */
  async parseDocument(file: File): Promise<ParsedDocument> {
    try {
      // Convert .docx to HTML
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const htmlContent = result.value;

      // Extract plain text for processing
      const textContent = this.htmlToText(htmlContent);

      // Find placeholders in the text
      const placeholders = this.extractPlaceholders(textContent);

      return {
        content: htmlContent,
        placeholders,
        originalFile: file,
      };
    } catch (error) {
      console.error("Error parsing document:", error);
      throw new Error(
        "Failed to parse document. Please ensure it's a valid .docx file."
      );
    }
  }

  /**
   * Extract placeholders from text content
   * Supports various placeholder formats:
   * - {{placeholder_name}}
   * - [PLACEHOLDER_NAME]
   * - <<placeholder_name>>
   * - {placeholder_name}
   */
  private extractPlaceholders(content: string): Placeholder[] {
    const placeholderPatterns = [
      /\{\{([^}]+)\}\}/g, // {{placeholder}}
      /\[([A-Z_\s]+)\]/g, // [PLACEHOLDER_NAME]
      /<<([^>]+)>>/g, // <<placeholder>>
      /\{([^}]+)\}/g, // {placeholder}
    ];

    const foundPlaceholders = new Set<string>();
    const placeholders: Placeholder[] = [];

    placeholderPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const originalText = match[0];
        const placeholderText = match[1].trim();

        // Skip if we've already found this placeholder
        if (foundPlaceholders.has(placeholderText.toLowerCase())) {
          continue;
        }

        foundPlaceholders.add(placeholderText.toLowerCase());

        const placeholder = this.createPlaceholder(
          placeholderText,
          originalText
        );
        placeholders.push(placeholder);
      }
    });

    return placeholders.sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Create a placeholder object with inferred type and metadata
   */
  private createPlaceholder(text: string, originalText: string): Placeholder {
    const cleanText = text.replace(/[_-]/g, " ").trim();
    const lowerText = cleanText.toLowerCase();

    // Infer type based on placeholder name
    let type: Placeholder["type"] = "text";
    let description = "";

    if (lowerText.includes("date") || lowerText.includes("time")) {
      type = "date";
      description = "Enter a date";
    } else if (lowerText.includes("email") || lowerText.includes("e-mail")) {
      type = "email";
      description = "Enter an email address";
    } else if (
      lowerText.includes("number") ||
      lowerText.includes("amount") ||
      lowerText.includes("price") ||
      lowerText.includes("cost")
    ) {
      type = "number";
      description = "Enter a number";
    } else {
      description = "Enter text";
    }

    // Determine if required based on context
    const required =
      !lowerText.includes("optional") && !lowerText.includes("if applicable");

    return {
      id: this.generateId(),
      label: this.formatLabel(cleanText),
      originalText,
      type,
      required,
      description,
    };
  }

  /**
   * Format placeholder label for display
   */
  private formatLabel(text: string): string {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Generate unique ID for placeholder
   */
  private generateId(): string {
    return `placeholder_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  /**
   * Replace placeholders in content with values
   */
  fillPlaceholders(content: string, placeholders: Placeholder[]): string {
    let filledContent = content;

    placeholders.forEach((placeholder) => {
      if (placeholder.value) {
        // Create a regex to find the placeholder in the content
        const escapedOriginal = placeholder.originalText.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );
        const regex = new RegExp(escapedOriginal, "g");
        filledContent = filledContent.replace(regex, placeholder.value);
      }
    });

    return filledContent;
  }

  /**
   * Validate placeholder values
   */
  validatePlaceholders(placeholders: Placeholder[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    placeholders.forEach((placeholder) => {
      if (placeholder.required && !placeholder.value?.trim()) {
        errors.push(`${placeholder.label} is required`);
        return;
      }

      if (placeholder.value) {
        switch (placeholder.type) {
          case "email":
            if (!this.isValidEmail(placeholder.value)) {
              errors.push(`${placeholder.label} must be a valid email address`);
            }
            break;
          case "number":
            if (isNaN(Number(placeholder.value))) {
              errors.push(`${placeholder.label} must be a valid number`);
            }
            break;
          case "date":
            if (!this.isValidDate(placeholder.value)) {
              errors.push(`${placeholder.label} must be a valid date`);
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

export default new DocumentParserService();
