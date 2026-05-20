/**
 * Test utilities for react-intl.
 *
 * Wraps RTL's `render` with an IntlProvider configured for Catalan so all
 * components under test see the same default behaviour as production
 * (DEFAULT_LANGUAGE=ca). Messages object is empty so FormattedMessage falls
 * back to its `defaultMessage` — that's what the assertions match against.
 */
import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

interface ProviderProps {
  children: React.ReactNode;
  locale?: string;
}

export function TestIntlProvider({ children, locale = 'ca' }: ProviderProps) {
  return (
    <IntlProvider locale={locale} messages={{}} defaultLocale="ca">
      {children}
    </IntlProvider>
  );
}

export function renderWithIntl(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { locale?: string },
): RenderResult {
  const { locale, ...rtlOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <TestIntlProvider locale={locale}>{children}</TestIntlProvider>
    ),
    ...rtlOptions,
  });
}
