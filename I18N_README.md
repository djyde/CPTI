# Internationalization (i18n) Setup

This project now supports internationalization with English (default) and Chinese.

## Configuration

The i18n configuration is set up in `astro.config.mjs`:

```javascript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'zh'],
  routing: {
    prefixDefaultLocale: false,
  },
}
```

## File Structure

- **English (default)**: `/` (no prefix)
  - `/` - Home page
  - `/quiz` - Quiz page
  - `/types/[type]` - Personality type pages

- **Chinese**: `/zh/` prefix
  - `/zh/` - Home page
  - `/zh/quiz` - Quiz page
  - `/zh/types/[type]` - Personality type pages

## Translation System

### Translation Files

- `src/i18n/ui.ts` - Contains all UI translations for both languages

### Usage

```typescript
import { getLangFromUrl, useTranslations } from '../i18n/ui';

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

// Use translations
<h1>{t('home.title')}</h1>
```

### Language Detection

The system automatically detects the language from the URL:
- `/` → English
- `/zh/` → Chinese

## Components

### Language Switcher

The `LanguageSwitcher.astro` component allows users to switch between languages. It's included in the main layout.

### Layout Updates

The main layout (`Layout.astro`) now includes:
- Language-aware navigation
- Language switcher in the header
- Proper `lang` attribute on the HTML element

## Adding New Translations

1. Add new keys to the `ui` object in `src/i18n/ui.ts`
2. Provide translations for both `en` and `zh`
3. Use the translation key in your components

Example:
```typescript
// In ui.ts
'en': {
  'new.key': 'English text',
},
'zh': {
  'new.key': '中文文本',
}

// In component
{t('new.key')}
```

## Navigation

All internal links should be language-aware:

```astro
<a href={lang === 'en' ? '/quiz' : `/${lang}/quiz`}>
  {t('nav.quiz')}
</a>
```

## React Components

For React components (like Quiz.tsx), pass the `lang` prop:

```tsx
interface QuizProps {
  lang?: 'en' | 'zh';
}

export default function Quiz({ lang = 'en' }: QuizProps) {
  // Use lang for translations
}
```

## Content

The content files (like `what-is.md`) remain the same and will be displayed in their original language. For fully localized content, you would need to create separate content files for each language.
