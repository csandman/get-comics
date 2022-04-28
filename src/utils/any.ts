/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Check whether any of the arguments passed in are truthy
 *
 * @param args - Any variable type to check for truthyness
 * @returns Whether or not any of the arguments is truthy
 */
function any(...args: any[]): boolean {
  return args.filter(Boolean).length > 0;
}

export default any;
