/**
 * Centralised react-intl message catalog for the volto-estades-delta addon.
 *
 * Why one file: the Volto i18n extractor walks the source tree for
 * `defineMessages` calls and writes a single .pot. Keeping all messages here
 * gives us one obvious place to audit when a translator is onboarded
 * (mes 1 según roadmap). Per-block message files are fine technically but
 * scatter the extractor surface.
 *
 * IDs follow the convention `estadesDelta.<scope>.<key>` so they cannot
 * collide with Volto core message IDs.
 *
 * Default messages are written in Catalan because `ca` is the site default
 * (DEFAULT_LANGUAGE=ca). Other languages live in locales/<lang>/LC_MESSAGES/
 * volto.po.
 */
import { defineMessages } from 'react-intl';

export const aggregatorFiltersMessages = defineMessages({
  checkin: {
    id: 'estadesDelta.aggregatorFilters.checkin',
    defaultMessage: 'Entrada',
  },
  checkout: {
    id: 'estadesDelta.aggregatorFilters.checkout',
    defaultMessage: 'Sortida',
  },
  guests: {
    id: 'estadesDelta.aggregatorFilters.guests',
    defaultMessage: 'Hostes',
  },
  zone: {
    id: 'estadesDelta.aggregatorFilters.zone',
    defaultMessage: 'Zona',
  },
  zoneAll: {
    id: 'estadesDelta.aggregatorFilters.zoneAll',
    defaultMessage: 'Tota la zona',
  },
  submit: {
    id: 'estadesDelta.aggregatorFilters.submit',
    defaultMessage: 'Cercar',
  },
  clear: {
    id: 'estadesDelta.aggregatorFilters.clear',
    defaultMessage: 'Esborrar filtres',
  },
});

export const aggregatorPropertyListMessages = defineMessages({
  loading: {
    id: 'estadesDelta.aggregatorPropertyList.loading',
    defaultMessage: 'Carregant propietats…',
  },
  error: {
    id: 'estadesDelta.aggregatorPropertyList.error',
    defaultMessage:
      'No s’han pogut carregar les propietats. Torna-ho a provar.',
  },
  empty: {
    id: 'estadesDelta.aggregatorPropertyList.empty',
    defaultMessage:
      'No hi ha cap propietat que coincideixi amb els filtres. Prova a ampliar la cerca.',
  },
  countSingular: {
    id: 'estadesDelta.aggregatorPropertyList.countSingular',
    defaultMessage: '{count} propietat',
  },
  countPlural: {
    id: 'estadesDelta.aggregatorPropertyList.countPlural',
    defaultMessage: '{count} propietats',
  },
  prev: {
    id: 'estadesDelta.aggregatorPropertyList.prev',
    defaultMessage: 'Anterior',
  },
  next: {
    id: 'estadesDelta.aggregatorPropertyList.next',
    defaultMessage: 'Següent',
  },
  page: {
    id: 'estadesDelta.aggregatorPropertyList.page',
    defaultMessage: 'Pàgina {current} de {total}',
  },
  editPreview: {
    id: 'estadesDelta.aggregatorPropertyList.editPreview',
    defaultMessage: 'Vista prèvia — 3 propietats d’exemple',
  },
});

export const aggregatorPropertyCardMessages = defineMessages({
  pricePrefix: {
    id: 'estadesDelta.aggregatorPropertyCard.pricePrefix',
    defaultMessage: 'des de',
  },
  pricePerNight: {
    id: 'estadesDelta.aggregatorPropertyCard.pricePerNight',
    defaultMessage: '/ nit',
  },
  guestsMeta: {
    id: 'estadesDelta.aggregatorPropertyCard.guestsMeta',
    defaultMessage: '{count} hostes',
  },
  bedroomsMeta: {
    id: 'estadesDelta.aggregatorPropertyCard.bedroomsMeta',
    defaultMessage: '{count, plural, one {# hab} other {# hab}}',
  },
  bathroomsMeta: {
    id: 'estadesDelta.aggregatorPropertyCard.bathroomsMeta',
    defaultMessage: '{count, plural, one {# bany} other {# banys}}',
  },
  noImage: {
    id: 'estadesDelta.aggregatorPropertyCard.noImage',
    defaultMessage: '(sense imatge)',
  },
  view: {
    id: 'estadesDelta.aggregatorPropertyCard.view',
    defaultMessage: 'Veure',
  },
});

export const propertyMapMessages = defineMessages({
  noCoords: {
    id: 'estadesDelta.propertyMap.noCoords',
    defaultMessage:
      'Sense coordenades — afegeix latitud i longitud a la propietat.',
  },
  ariaLabel: {
    id: 'estadesDelta.propertyMap.ariaLabel',
    defaultMessage: 'Mapa de localització de {title}',
  },
  fallbackTitle: {
    id: 'estadesDelta.propertyMap.fallbackTitle',
    defaultMessage: 'Propietat',
  },
});

export const propertyViewMessages = defineMessages({
  howToGet: {
    id: 'estadesDelta.propertyView.howToGet',
    defaultMessage: 'Com arribar-hi',
  },
});
