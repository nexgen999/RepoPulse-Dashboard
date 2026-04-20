/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { translations } from '../i18n/translations';

export function useTranslation(lang: string = 'en_us') {
  const t = (key: string) => {
    const keys = key.split('.');
    
    // Normalize language code (handle old 'en' / 'fr' codes)
    let solvedLang = lang;
    if (lang === 'en') solvedLang = 'en_us';
    if (lang === 'fr') solvedLang = 'fr_fr';
    if (lang === 'es') solvedLang = 'es_es';
    
    let current = translations[solvedLang] || translations['en_us'];
    
    for (const k of keys) {
      if (current[k] === undefined) {
        // Fallback to English (US)
        let fallback = translations['en_us'];
        for (const fk of keys) {
          if (fallback[fk] === undefined) return key;
          fallback = fallback[fk];
        }
        return fallback;
      }
      current = current[k];
    }
    
    return current;
  };

  return { t };
}
