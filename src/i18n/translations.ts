/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import en_us from './locales/en_us.json';
import fr_fr from './locales/fr_fr.json';
import es_es from './locales/es_es.json';
import ru_ru from './locales/ru_ru.json';
import zh_cn from './locales/zh_cn.json';

export const translations: Record<string, any> = {
  en_us,
  fr_fr,
  es_es,
  ru_ru,
  zh_cn,
  // Existing languages (legacy codes or temporary manual objects)
  it_it: {
    common: { dashboard: "Dashboard", settings: "Impostazioni", about: "Informazioni", refresh: "Aggiorna", add: "Aggiungi", edit: "Modifica", delete: "Elimina", save: "Salva", cancel: "Annulla", import: "Importa", export: "Esporta", loading: "Caricamento...", search: "Cerca...", all: "Tutto", favorites: "Preferiti", repoManagement: "Gestione Dépôts", releaseAnalytics: "Analisi Release", new: "NUOVO", notifications: "Notifiche", noNotifications: "Nessun aggiornamento", back: "Indietro", actions: "Azioni", apply: "Applica", disabled: "Disabilitato" },
    dashboard: { title: "Rilasci Software", subtitle: "Segui i tuoi progetti preferiti.", noReleases: "Nessun rilascio trovato.", filterByCategory: "Filtra per Categoria", sortBy: "Ordina per", latest: "Recenti", oldest: "Vecchi", name: "Nome" },
    settings: { title: "Configurazione", subtitle: "Personalizza la tua esperienza.", api: "Autenticazione API", structure: "Gestione Struttura", appearance: "Aspetto e Tema", data: "Gestione Dati", language: "Lingua", theme: "Tema", light: "Chiaro", dark: "Scuro", accentColor: "Colore Accento", autoRefresh: "Intervallo Aggiornamento" }
  },
  de_de: {
    common: { dashboard: "Dashboard", settings: "Einstellungen", about: "Über", refresh: "Aktualisieren", add: "Hinzufügen", edit: "Bearbeiten", delete: "Löschen", save: "Speichern", cancel: "Abbrechen", import: "Importieren", export: "Exportieren", loading: "Laden...", search: "Suchen...", all: "Alle", favorites: "Favoriten", new: "NEU", notifications: "Benachrichtigungen", noNotifications: "Keine Updates", back: "Zurück", actions: "Aktionen", apply: "Anwenden", disabled: "Deaktiviert" },
    dashboard: { title: "Software-Releases", subtitle: "Verfolgen Sie Ihre Projekte.", noReleases: "Keine Releases gefunden.", filterByCategory: "Nach Kategorie filtern", sortBy: "Sortieren nach", latest: "Neueste", oldest: "Älteste", name: "Name" }
  }
};

export const LANGUAGES = [
  { code: 'en_us', name: 'English (US)' },
  { code: 'fr_fr', name: 'Français (France)' },
  { code: 'es_es', name: 'Español (España)' },
  { code: 'it_it', name: 'Italiano (Italia)' },
  { code: 'de_de', name: 'Deutsch (Deutschland)' },
  { code: 'ru_ru', name: 'Русский (Россия)' },
  { code: 'zh_cn', name: '中文 (中国)' },
  { code: 'ja_jp', name: '日本語 (日本)' },
  { code: 'ko_kr', name: '한국어 (대한민국)' }
];
