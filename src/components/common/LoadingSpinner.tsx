import React from 'react';
import { AppLoaderModal } from './AppLoaderModal';
import { AppLoader }      from './AppLoader';

export const LoadingSpinner: React.FC<{ fullScreen?: boolean }> = ({ fullScreen }) =>
  fullScreen
    ? <AppLoaderModal visible />
    : <AppLoader visible size="md" />;
