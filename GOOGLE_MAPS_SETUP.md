# Google Maps API Setup Guide

This guide will walk you through setting up the Google Maps Places API for address autocomplete functionality.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step-by-Step Instructions

### 1. Create or Select a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. If you don't have a project, click "Create Project"
   - Enter a project name (e.g., "YourNativeTongue")
   - Click "Create"
3. If you already have a project, select it from the project dropdown at the top

### 2. Enable the Places API

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "Places API (New)"
3. Click on "Places API (New)" from the results
4. Click the **Enable** button
   - Note: Google also offers "Places API" (the legacy version). Make sure to enable "Places API (New)"

### 3. Create API Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Your API key will be created and displayed
4. Copy the API key (you'll need it in the next step)

### 4. Restrict Your API Key (Recommended for Production)

For security, it's recommended to restrict your API key:

1. Click on the API key you just created to edit it
2. Under **API restrictions**, select **Restrict key**
3. Select **Places API (New)** from the list
4. Under **Application restrictions**, choose one of:
   - **HTTP referrers** (recommended for web apps)
     - Add your domain(s): `localhost:5173`, `yourdomain.com`, `*.yourdomain.com`
   - **None** (only for development/testing)
5. Click **Save**

### 5. Add API Key to Your Project

1. In your project root, create a `.env` file (if it doesn't exist)
2. Add the following line:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with the actual API key you copied
4. Save the file

**Important:** The `.env` file is already in `.gitignore`, so your API key won't be committed to version control.

### 6. Restart Your Development Server

If your development server is running, restart it to load the new environment variable:
```bash
npm run dev
```

## Billing Information

Google provides $200 in free credits per month for Maps Platform APIs. For most development and small-scale applications, this is sufficient. However, be aware that:

- The Places API (New) has usage limits and charges based on requests
- Monitor your usage in the Google Cloud Console
- Set up billing alerts to avoid unexpected charges
- See [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/) for details

## Testing the Integration

1. Navigate to the Organization Setup page
2. Click on the Address field
3. Start typing an address
4. You should see address suggestions appear in a dropdown
5. Select a suggestion to auto-fill the address, city, state, and ZIP code fields

## Troubleshooting

### "Address autocomplete is disabled" Error

- Check that your API key is correctly set in the `.env` file
- Verify the environment variable name is exactly `VITE_GOOGLE_MAPS_API_KEY`
- Restart your development server after adding the API key
- Check the browser console for detailed error messages

### "Failed to load Google Maps script" Error

- Verify your API key is valid and not restricted incorrectly
- Check that the Places API (New) is enabled in your Google Cloud project
- Ensure your domain is in the allowed HTTP referrers (if you restricted the key)
- Check your network connection

### No Suggestions Appearing

- Verify the Places API (New) is enabled (not just the legacy Places API)
- Check the browser console for API errors
- Ensure you're typing at least a few characters
- Verify your API key hasn't exceeded usage limits

### API Key Security Best Practices

1. **Never commit your API key to version control**
   - The `.env` file is already in `.gitignore`
   - Use `.env.example` as a template (without the actual key)

2. **Restrict your API key**
   - Use HTTP referrer restrictions for production
   - Limit to only the APIs you need (Places API (New))

3. **Monitor usage**
   - Set up billing alerts in Google Cloud Console
   - Regularly check API usage in the dashboard

4. **Rotate keys if compromised**
   - If a key is exposed, immediately regenerate it in Google Cloud Console

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

