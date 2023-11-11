import { ApolloError } from '@apollo/client';
import { SourceLocation } from 'graphql';
import { FORBIDDEN, UNAUTHORIZED } from '../constants/shared.constants';

export const isDeniedAccess = (error: ApolloError | undefined) => {
  if (!error?.message) {
    return false;
  }
  return [UNAUTHORIZED, FORBIDDEN].includes(error.message);
};

export const isEntityTooLarge = (error: ApolloError | undefined) => {
  const statusCode =
    error?.networkError &&
    'statusCode' in error.networkError &&
    error.networkError.statusCode;

  return statusCode === 413;
};

export const formatGQLError = (
  message: string,
  path?: readonly (string | number)[],
  locations?: readonly SourceLocation[],
) => {
  const locationsStr = JSON.stringify(locations);
  return `[GraphQL error]: Message: ${message}, Locations: ${locationsStr}, Path: ${path}`;
};
