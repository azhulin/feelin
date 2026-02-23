import { normalizeContextKey } from 'lezer-feel';

import { getType } from './types.js';

export type SourceLocation = {
  from: number,
  to: number
};

export function parseParameterNames(fn) {

  if (Array.isArray(fn.$args)) {
    return fn.$args;
  }

  const code = fn.toString();

  const match = /^(?:[^(]*\s*)?\(([^)]+)?\)/.exec(code);

  if (!match) {
    throw new Error('failed to parse params: ' + code);
  }

  const [ _, params ] = match;

  if (!params) {
    return [];
  }

  return params.split(',').map(p => p.trim());
}

export type ErrorType = 'SYNTAX' | 'NOT_IMPLEMENTED' | 'UNSUPPORTED';

export class FeelInError extends Error {
  constructor(public readonly type: ErrorType, message: string) {
    super(message);
  }
}

export class FeelInNotImplementedError extends FeelInError {
  constructor(public readonly thing: string) {
    super('NOT_IMPLEMENTED', `Not implemented: ${thing}.`);
  }
}

export class FeelInUnsupportedError extends FeelInError {
  constructor(public readonly thing: string) {
    super('UNSUPPORTED', `Unsupported ${thing}.`);
  }
}

export class FeelInSyntaxError extends FeelInError {

  input: string;

  position: SourceLocation;

  constructor(
      message: string,
      details: {
        input: string,
        position: SourceLocation
      }
  ) {
    super('SYNTAX', message);

    Object.assign(this, details);
  }
}

export function notImplemented(thing: string) {
  return new FeelInNotImplementedError(thing);
}

export function isNotImplemented(err: unknown) {
  return err instanceof FeelInNotImplementedError;
}

/**
 * Returns a name from context or undefined if it does not exist.
 *
 * @param {string} name
 * @param {Record<string, any>} context
 *
 * @return {any|undefined}
 */
export function getFromContext(name, context) {

  if ([ 'nil', 'boolean', 'number', 'string' ].includes(getType(context))) {
    return undefined;
  }

  if (name in context) {
    return context[name];
  }

  const normalizedName = normalizeContextKey(name);

  if (normalizedName in context) {
    return context[normalizedName];
  }

  const entry = Object.entries(context).find(
    ([ key ]) => normalizedName === normalizeContextKey(key)
  );

  if (entry) {
    return entry[1];
  }

  return undefined;
}
