#!/usr/bin/env python3
"""Extract conversation from ChatGPT MHTML file and output as clean markdown."""

import re
import quopri
import sys
from pathlib import Path


def decode_quoted_printable(text):
    """Decode quoted-printable encoded text to UTF-8."""
    # Remove soft line breaks (= at end of line)
    text = re.sub(r'=\r?\n', '', text)
    # Decode quoted-printable
    try:
        return quopri.decodestring(text.encode('latin-1'), header=False).decode('utf-8', errors='replace')
    except Exception:
        return text


def extract_html_from_mhtml(filepath):
    """Extract and decode the HTML content from an MHTML file."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    html_start = content.find('Content-Type: text/html')
    if html_start == -1:
        raise ValueError("No HTML content found in MHTML")

    rest = content[html_start:]
    doctype_pos = rest.find('<!DOCTYPE')
    if doctype_pos == -1:
        doctype_pos = rest.find('<html')
    if doctype_pos == -1:
        raise ValueError("Could not find HTML start in MHTML")

    html_content = rest[doctype_pos:]
    boundary_match = re.search(r'\n------MultipartBoundary--', html_content)
    if boundary_match:
        html_content = html_content[:boundary_match.start()]

    return decode_quoted_printable(html_content)


def clean_text(text):
    """Clean extracted text by removing HTML noise and artifacts."""
    # Remove lines that are purely HTML attributes (common in message wrappers)
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip lines that start with typical HTML attribute patterns
        if re.match(r'^(data-message-id|data-message-model-slug|data-turn-start-message|data-msg-pos|data-message-timestamp|data-utc-time|data-nonce-id)=', stripped):
            continue
        if re.match(r'^(class|dir|tabindex|role|aria-)=', stripped):
            continue
        if re.match(r'^</?\w+.*>$', stripped):
            continue
        cleaned_lines.append(line)
    text = '\n'.join(cleaned_lines)
    text = text.strip()

    # Remove standalone attribute-value fragments that start lines
    text = re.sub(r'^\s*(data-message-id|data-message-model-slug|data-msg-pos|data-message-timestamp|data-turn-start-message|data-utc-time|data-nonce-id)="[^"]*"\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*(class|dir|tabindex)="[^"]*"\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*</?\w+[^>]*>\s*$', '', text, flags=re.MULTILINE)

    # Remove "ChatGPT said:" / "You said:" labels
    text = re.sub(r'^\s*ChatGPT said:\s*', '', text)
    text = re.sub(r'^\s*You said:\s*', '', text)

    # Remove "Thought for Xs" / "Thought for Xm Xs" labels
    text = re.sub(r'Thought for \d+s', '', text)
    text = re.sub(r'Thought for \d+m \d+s', '', text)
    text = re.sub(r'思考中…', '', text)
    text = re.sub(r'已思考 \d+s', '', text)

    # Remove lines that are just stray <div or </div> fragments
    text = re.sub(r'^\s*<div\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*</div>\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*<br\s*/?\s*>\s*$', '', text, flags=re.MULTILINE)

    # Remove stray <div followed by newline + content (merge)
    text = re.sub(r'<div\s*\n+', '\n', text)

    # Remove empty emphasis markers (from empty <strong>/<p> tags)
    # Single lines of just asterisks are HTML artifacts
    text = re.sub(r'^\s*\*+\s*$', '', text, flags=re.MULTILINE)

    # Remove file upload annotations (ChatGPT saved HTML labels)
    text = re.sub(r'^\s*Pasted\s+.+$', '', text, flags=re.MULTILINE)
    # Standalone "File" labels (following file annotations)
    text = re.sub(r'^\s*File\s*$', '', text, flags=re.MULTILINE)

    # Remove "ChatGPT said:" / "You said:" lines
    text = re.sub(r'^\s*ChatGPT said:\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*You said:\s*$', '', text, flags=re.MULTILINE)
    # Also handle "ChatGPT said:" or "You said:" at the start of a block
    text = re.sub(r'^\s*ChatGPT said:\s*', '', text)
    text = re.sub(r'^\s*You said:\s*', '', text)

    # Remove "Sources" annotation lines
    text = re.sub(r'^\s*Sources\s*$', '', text, flags=re.MULTILINE)

    # Remove numeric turn indicators like "1 / 1", "2/2", etc.
    text = re.sub(r'^\s*\d+\s*/\s*\d+\s*$', '', text, flags=re.MULTILINE)

    # Remove empty lines caused by cleanup
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    # Remove numeric turn indicators like "1 / 1", "2/2", etc.
    text = re.sub(r'^\s*\d+\s*/\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\s*/\s*\d+\s*$', '', text, flags=re.MULTILINE)

    # Clean whitespace
    text = re.sub(r' {3,}', '  ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    # Remove ChatGPT UI artifacts at the end of conversations
    text = re.sub(r'\n+\s*ChatGPT can make mistakes\. Check important info\.\s*', '', text)
    text = re.sub(r'\n+\s*Extended\*+\s*', '', text)
    text = re.sub(r'\n+\s*⋮+\s*', '', text)
    # Clean up action button text artifacts
    text = re.sub(r'\n+\s*\*\*Ask for changes\s*', '', text)
    text = re.sub(r'\n+\s*\*\*Text\*\*\s*', '', text)
    text = re.sub(r'\n+\s*⌘K\s*', '', text)
    # Remove trailing content that is just UI artifacts
    text = re.sub(r'(\*\*Ask for changes\s*\n*\s*⌘K\s*\n*\s*\*\*Text\*\*\s*)+$', '', text)
    # Remove trailing misc UI symbols (kebab menu, keyboard shortcuts)
    text = re.sub(r'[⋮⌘K]+\s*$', '', text)
    text = text.rstrip()

    # Final whitespace cleanup
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    return text


def extract_text_from_html_block(html_block):
    """Extract readable text from an HTML message block, preserving structure."""
    # Remove script and style tags with their content
    html = re.sub(r'<script[^>]*>.*?</script>', '', html_block, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html_block, flags=re.DOTALL | re.IGNORECASE)

    # Remove SVG elements
    html = re.sub(r'<svg[^>]*>.*?</svg>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Replace block elements with newlines
    block_tags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br', 'hr', 'tr', 'pre', 'blockquote', 'section', 'article', 'header', 'footer']
    for tag in block_tags:
        html = re.sub(rf'</?{tag}[^>]*>', '\n', html, flags=re.IGNORECASE)

    # Handle ordered/unordered lists - preserve list markers
    html = re.sub(r'</?ul[^>]*>', '\n', html, flags=re.IGNORECASE)
    html = re.sub(r'</?ol[^>]*>', '\n', html, flags=re.IGNORECASE)

    # Convert <code> to backticks
    html = re.sub(r'<code[^>]*>', '`', html, flags=re.IGNORECASE)
    html = re.sub(r'</code>', '`', html, flags=re.IGNORECASE)

    # Convert <strong>/<b> to **
    html = re.sub(r'</?(?:strong|b)[^>]*>', '**', html, flags=re.IGNORECASE)

    # Convert <em>/<i> to *
    html = re.sub(r'</?(?:em|i)[^>]*>', '*', html, flags=re.IGNORECASE)

    # Remove remaining HTML tags
    html = re.sub(r'<[^>]+>', '', html)

    # Decode common HTML entities
    html = html.replace('&amp;', '&')
    html = html.replace('&lt;', '<')
    html = html.replace('&gt;', '>')
    html = html.replace('&quot;', '"')
    html = html.replace('&#x27;', "'")
    html = html.replace('&apos;', "'")
    html = html.replace('&#39;', "'")
    html = html.replace('&nbsp;', ' ')
    html = html.replace('&#x2F;', '/')

    # Clean up lines
    lines = []
    for line in html.split('\n'):
        stripped = line.strip()
        if stripped:
            lines.append(stripped)

    if not lines:
        return ''

    text = '\n'.join(lines)
    return text


def extract_conversation_turns(html_content):
    """Split HTML into raw message blocks by data-message-author-role."""
    # Split on data-message-author-role markers
    parts = re.split(r'data-message-author-role="(user|assistant)"', html_content)

    # parts[0] is content before first message
    # then pairs of (role, content)
    raw_turns = []
    for i in range(1, len(parts), 2):
        role = parts[i]
        content = parts[i + 1] if i + 1 < len(parts) else ""
        raw_turns.append((role, content))

    return raw_turns


def group_consecutive_turns(raw_turns):
    """Group consecutive same-role messages (from thinking models)."""
    if not raw_turns:
        return []

    grouped = []
    current_role = raw_turns[0][0]
    current_text = extract_text_from_html_block(raw_turns[0][1])

    for role, content in raw_turns[1:]:
        text = extract_text_from_html_block(content)
        if role == current_role:
            # Merge consecutive same-role messages
            if text.strip():
                current_text += '\n\n' + text.strip()
        else:
            # Finish current group
            cleaned = clean_text(current_text)
            if cleaned:
                grouped.append((current_role, cleaned))
            # Start new group
            current_role = role
            current_text = text

    # Don't forget the last group
    cleaned = clean_text(current_text)
    if cleaned:
        grouped.append((current_role, cleaned))

    return grouped


def assemble_markdown(turns, title):
    """Convert grouped turns to markdown format."""
    lines = [f"# {title}\n"]

    for role, content in turns:
        if role == 'user':
            lines.append("## User\n")
        elif role == 'assistant':
            lines.append("## Assistant\n")
        else:
            lines.append(f"## {role}\n")

        lines.append(content)
        lines.append("")

    return '\n'.join(lines)


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else (
        '/Users/josephdeng/Documents/wb-markdown/docs/渐进式披露设计指南.mhtml'
    )

    print(f"Reading MHTML: {input_path}")

    # Extract and decode HTML
    html_content = extract_html_from_mhtml(input_path)
    print(f"Decoded HTML length: {len(html_content)} chars")

    # Extract raw message blocks
    raw_turns = extract_conversation_turns(html_content)
    print(f"Found {len(raw_turns)} raw message blocks")

    # Group consecutive same-role messages
    turns = group_consecutive_turns(raw_turns)
    print(f"Grouped into {len(turns)} conversation turns")

    # Print summary
    for i, (role, content) in enumerate(turns):
        preview = content[:80].replace('\n', ' | ')
        print(f"  [{i+1}] {role}: {preview}...")

    # Assemble and write
    title = Path(input_path).stem
    md = assemble_markdown(turns, title)

    output_path = str(Path(input_path).with_suffix('.md'))
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md)

    print(f"\nWritten to: {output_path}")


if __name__ == '__main__':
    main()
