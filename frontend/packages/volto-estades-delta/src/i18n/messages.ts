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

export const propertyCalendarMessages = defineMessages({
  prevMonth: {
    id: 'estadesDelta.propertyCalendar.prevMonth',
    defaultMessage: 'Mes anterior',
  },
  nextMonth: {
    id: 'estadesDelta.propertyCalendar.nextMonth',
    defaultMessage: 'Mes següent',
  },
  legendAvailable: {
    id: 'estadesDelta.propertyCalendar.legendAvailable',
    defaultMessage: 'Disponible',
  },
  legendUnavailable: {
    id: 'estadesDelta.propertyCalendar.legendUnavailable',
    defaultMessage: 'Ocupat',
  },
  legendPast: {
    id: 'estadesDelta.propertyCalendar.legendPast',
    defaultMessage: 'Passat',
  },
  weekdayShortMonday: {
    id: 'estadesDelta.propertyCalendar.weekdayShortMonday',
    defaultMessage: 'Dl',
  },
  weekdayShortTuesday: {
    id: 'estadesDelta.propertyCalendar.weekdayShortTuesday',
    defaultMessage: 'Dt',
  },
  weekdayShortWednesday: {
    id: 'estadesDelta.propertyCalendar.weekdayShortWednesday',
    defaultMessage: 'Dc',
  },
  weekdayShortThursday: {
    id: 'estadesDelta.propertyCalendar.weekdayShortThursday',
    defaultMessage: 'Dj',
  },
  weekdayShortFriday: {
    id: 'estadesDelta.propertyCalendar.weekdayShortFriday',
    defaultMessage: 'Dv',
  },
  weekdayShortSaturday: {
    id: 'estadesDelta.propertyCalendar.weekdayShortSaturday',
    defaultMessage: 'Ds',
  },
  weekdayShortSunday: {
    id: 'estadesDelta.propertyCalendar.weekdayShortSunday',
    defaultMessage: 'Dg',
  },
});

export const messagingMessages = defineMessages({
  listTitle: {
    id: 'estadesDelta.messaging.listTitle',
    defaultMessage: 'Conversacions amb hostes',
  },
  listSubtitle: {
    id: 'estadesDelta.messaging.listSubtitle',
    defaultMessage: '{count, plural, =0 {Cap conversa} one {1 conversa} other {# converses}}',
  },
  loading: {
    id: 'estadesDelta.messaging.loading',
    defaultMessage: 'Carregant…',
  },
  loadError: {
    id: 'estadesDelta.messaging.loadError',
    defaultMessage: 'No s’han pogut carregar les converses.',
  },
  empty: {
    id: 'estadesDelta.messaging.empty',
    defaultMessage: 'Encara no hi ha cap conversa.',
  },
  colTitle: {
    id: 'estadesDelta.messaging.colTitle',
    defaultMessage: 'Conversa',
  },
  colChannel: {
    id: 'estadesDelta.messaging.colChannel',
    defaultMessage: 'Canal',
  },
  colState: {
    id: 'estadesDelta.messaging.colState',
    defaultMessage: 'Estat',
  },
  colModified: {
    id: 'estadesDelta.messaging.colModified',
    defaultMessage: 'Darrera activitat',
  },
  prev: {
    id: 'estadesDelta.messaging.prev',
    defaultMessage: 'Anterior',
  },
  next: {
    id: 'estadesDelta.messaging.next',
    defaultMessage: 'Següent',
  },
  page: {
    id: 'estadesDelta.messaging.page',
    defaultMessage: 'Pàgina {current} de {total}',
  },
  backToList: {
    id: 'estadesDelta.messaging.backToList',
    defaultMessage: 'Tornar al llistat',
  },
  detailSubtitle: {
    id: 'estadesDelta.messaging.detailSubtitle',
    defaultMessage: 'Canal: {channel} · Mode: {mode} · Estat: {state}',
  },
  noMessages: {
    id: 'estadesDelta.messaging.noMessages',
    defaultMessage: 'Aquesta conversa encara no té missatges.',
  },
  suggestedResponse: {
    id: 'estadesDelta.messaging.suggestedResponse',
    defaultMessage: 'Resposta suggerida per la IA (editable):',
  },
  approveSend: {
    id: 'estadesDelta.messaging.approveSend',
    defaultMessage: 'Aprovar i enviar',
  },
  approving: {
    id: 'estadesDelta.messaging.approving',
    defaultMessage: 'Enviant…',
  },
  approveError: {
    id: 'estadesDelta.messaging.approveError',
    defaultMessage: 'Error en aprovar la resposta',
  },
});
