export const languages = {
  en: 'English',
  zh: '中文',
} as const;

export const defaultLang = 'en' as const;

export type Lang = keyof typeof languages;
export type UITranslations = typeof ui[typeof defaultLang];

import en from './en.json' with { type: "json" };
import zh from './zh.json' with { type: "json" };

export const ui = {
  en,
  zh
} as const;

/**
 * Get language from URL with robust error handling
 */
export function getLangFromUrl(url: URL): Lang {
  try {
    const [, lang] = url.pathname.split('/');
    
    // Validate that the language exists in our configuration
    if (lang && lang in ui && lang in languages) {
      return lang as Lang;
    }
    
    return defaultLang;
  } catch (error) {
    console.warn('Error parsing language from URL:', error);
    return defaultLang;
  }
}

/**
 * Check if a language is supported
 */
export function isSupportedLang(lang: string): lang is Lang {
  return lang in ui && lang in languages;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): readonly Lang[] {
  return Object.keys(languages) as readonly Lang[];
}

/**
 * Create a translation function with fallback support
 */
export function useTranslations(lang: Lang) {
  return function t(key: keyof UITranslations, params?: Record<string, string | number>): string {
    try {
      // Try to get translation from current language
      let translation = ui[lang]?.[key];
      
      // Fallback to default language if not found
      if (!translation) {
        translation = ui[defaultLang]?.[key];
      }
      
      // Final fallback to key itself
      if (!translation) {
        console.warn(`Translation not found for key: ${key} in language: ${lang}`);
        return String(key);
      }
      
      // Replace parameters if provided
      if (params) {
        return Object.entries(params).reduce((result: string, [param, value]) => {
          return result.replace(new RegExp(`{${param}}`, 'g'), String(value));
        }, translation);
      }
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return String(key);
    }
  };
}

/**
 * Get the opposite language
 */
export function getOppositeLang(currentLang: Lang): Lang {
  return currentLang === 'en' ? 'zh' : 'en';
}

/**
 * Construct a path for a specific language
 */
export function getPathForLang(path: string, targetLang: Lang): string {
  try {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // If target language is default, return path without language prefix
    if (targetLang === defaultLang) {
      return normalizedPath;
    }
    
    // Add language prefix for non-default languages
    return `/${targetLang}${normalizedPath}`;
  } catch (error) {
    console.error('Error constructing path for language:', error);
    return '/';
  }
}

/**
 * Extract path without language prefix
 */
export function getPathWithoutLang(path: string, currentLang: Lang): string {
  try {
    // If current language is default, return path as is
    if (currentLang === defaultLang) {
      return path.startsWith('/') ? path : `/${path}`;
    }
    
    // Remove language prefix if it exists
    const langPrefix = `/${currentLang}`;
    if (path.startsWith(langPrefix)) {
      const pathWithoutPrefix = path.slice(langPrefix.length);
      return pathWithoutPrefix || '/';
    }
    
    return path.startsWith('/') ? path : `/${path}`;
  } catch (error) {
    console.error('Error extracting path without language:', error);
    return '/';
  }
}
