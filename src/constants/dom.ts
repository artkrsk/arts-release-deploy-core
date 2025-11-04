/** EDD-specific DOM selectors for file fields and UI elements */
export const EDD_SELECTORS = {
  /** EDD file upload input field */
  UPLOAD_FIELD: '.edd_repeatable_upload_field',

  /** Wrapper around EDD file upload field */
  UPLOAD_WRAPPER: '.edd_repeatable_upload_wrapper',

  /** EDD file name input field */
  NAME_FIELD: '.edd_repeatable_name_field',

  /** Container for EDD file upload field */
  UPLOAD_FIELD_CONTAINER: '.edd_repeatable_upload_field_container',

  /** EDD repeatable row standard fields container */
  REPEATABLE_ROW: '.edd-repeatable-row-standard-fields',

  /** EDD Software Licensing version field */
  VERSION_FIELD: '#edd_sl_version',

  /** EDD Software Licensing changelog field (TinyMCE editor ID) */
  CHANGELOG_FIELD: '#edd_sl_changelog',

  /** Label for changelog field */
  CHANGELOG_LABEL: 'label[for="edd_sl_changelog"]'
} as const
