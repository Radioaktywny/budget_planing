# Google Gemini Integration Setup

The application now supports Google Gemini AI for much more accurate PDF parsing, especially for Polish bank statements.

## Why Gemini?

- **Better accuracy**: AI understands context, not just patterns
- **Multi-language support**: Works great with Polish documents
- **Smart amount parsing**: Correctly handles `149,06 zł` as `149.06`
- **Automatic categorization**: Can suggest categories based on description
- **Flexible format handling**: Adapts to different bank statement layouts

## Setup Instructions

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

**Note**: Gemini API has a generous free tier:
- 60 requests per minute
- 1,500 requests per day
- Perfect for personal budget management!

### 2. Configure the API Key

Add the API key to your `.env` file in the `ai-service` directory:

```bash
# ai-service/.env
GEMINI_API_KEY=your_api_key_here
```

### 3. Install Dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

This will install the `google-generativeai` package.

### 4. Restart the AI Service

```bash
# Stop the current service (Ctrl+C)
# Then restart
uvicorn main:app --reload --port 8001
```

### 5. Test It!

Upload a Polish bank statement PDF through the Import page. The parser will now:
- Use Gemini AI if the API key is configured
- Automatically fallback to regex parser if Gemini is unavailable
- Correctly parse Polish amounts and dates
- Suggest categories based on transaction descriptions

## How It Works

### Prompt Engineering

The Gemini parser sends a carefully crafted prompt that:

1. **Explains the format**: Tells Gemini about Polish date/amount formats
2. **Provides context**: Shares your existing categories for better matching
3. **Requests structured output**: Asks for JSON in a specific format
4. **Handles edge cases**: Explicitly mentions comma as decimal separator

### Example Prompt

```
You are a bank statement parser. Extract all transactions from the following bank statement text.

IMPORTANT INSTRUCTIONS:
1. The document may be in Polish or English
2. For Polish amounts: comma (,) is the decimal separator
   - Example: "149,06 zł" = 149.06 (NOT 14906.00)
3. For dates: Polish format is DD.MM.YYYY
4. Transaction type should be "income" or "expense"

Available categories: Food, Transport, Shopping, Bills, Transfer, ...

Return ONLY a JSON object with this structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "amount": 149.06,
      "description": "Transaction description",
      "type": "expense",
      "category": "Category name or null"
    }
  ]
}
```

## Fallback Behavior

If Gemini is not available (no API key or API error), the system automatically falls back to the regex-based parser. This ensures the application always works, even without Gemini.

## Cost Considerations

### Free Tier Limits
- 60 requests/minute
- 1,500 requests/day
- More than enough for personal use

### Typical Usage
- Parsing one PDF = 1 request
- If you import 10 PDFs per day = 10 requests
- Well within free tier limits!

### Paid Tier (if needed)
- $0.00025 per 1K characters input
- $0.0005 per 1K characters output
- A typical bank statement PDF might cost $0.001-0.01 to parse
- Still very affordable!

## Troubleshooting

### "Gemini API key not provided" Error

Make sure you've:
1. Created the `.env` file in `ai-service` directory
2. Added `GEMINI_API_KEY=your_key` to the file
3. Restarted the AI service

### Amounts Still Wrong

If amounts are still incorrect:
1. Check the AI service logs for errors
2. Verify the API key is working
3. Try uploading a different PDF
4. Check if the PDF text extraction is working (some PDFs are scanned images)

### API Rate Limits

If you hit rate limits:
- Free tier: 60 requests/minute, 1,500/day
- Wait a few minutes and try again
- Consider upgrading to paid tier if needed

## Alternative: OpenAI GPT

If you prefer OpenAI GPT instead of Gemini, you can easily modify `gemini_pdf_parser.py` to use the OpenAI API. The prompt structure would be similar.

## Privacy Note

When using Gemini:
- Your PDF text is sent to Google's servers
- Google may use it to improve their models
- If privacy is a concern, use the regex parser instead (set `use_gemini=False`)
- Or self-host an open-source LLM

## Benefits Summary

✅ **Much better accuracy** for Polish documents  
✅ **Correct amount parsing** (149,06 → 149.06)  
✅ **Smart categorization** based on description  
✅ **Flexible format handling** for different banks  
✅ **Free tier** is generous for personal use  
✅ **Automatic fallback** if unavailable  

Enjoy accurate PDF parsing! 🎉
