# Logo Instructions

## How to Add Your Logo to NIAVERSE

To add your custom logo to the NIAVERSE platform, follow these steps:

### 1. Prepare Your Logo
- Create a logo image file (PNG, JPG, or SVG format recommended)
- Recommended size: 512x512 pixels or higher for best quality
- The logo should work well on both light and dark backgrounds
- Make sure it's optimized for web use

### 2. Add the Logo File
- Name your logo file `logo.png` (or `logo.jpg` or `logo.svg`)
- Place it in the `/public/` folder of your project
- The file path should be: `/public/logo.png`

### 3. Logo Placement
Your logo will automatically appear in the following locations:
- **Homepage**: Large circular logo (128x128px display)
- **Login/Register pages**: Medium circular logo (96x96px display)
- **Dashboard header**: Small circular logo (40x40px display)
- **Other pages**: Small circular logo (40x40px display)

### 4. Fallback Behavior
If no logo file is found, the system will display "NV" text as a fallback in each location.

### 5. File Structure
```
/public/
  ├── logo.png          <- Your logo file here
  ├── favicon.ico
  └── other assets...
```

### 6. Testing
After adding your logo:
1. Restart the development server (`npm run dev`)
2. Navigate to different pages to ensure the logo appears correctly
3. Test on different screen sizes to ensure it looks good

### 7. Customization
If you need to adjust the logo size or styling, you can modify the CSS classes in the respective page files:
- Homepage: `/src/app/page.tsx`
- Login: `/src/app/login/page.tsx`
- Register: `/src/app/register/page.tsx`
- Dashboard: `/src/app/dashboard/page.tsx`
- Other pages: Look for similar logo implementations

### Current Logo Specifications
- **Homepage**: `w-24 h-24` (96x96px in a 128x128px circle)
- **Auth pages**: `w-16 h-16` (64x64px in a 96x96px circle)
- **Header**: `w-8 h-8` (32x32px in a 40x40px circle)

The logo is automatically contained within circular white backgrounds for consistency across the platform.