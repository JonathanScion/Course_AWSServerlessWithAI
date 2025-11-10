import React from 'react';
import CrudPage from './CrudPage';
import { buildingsConfig } from './pageConfigs';

const Buildings = () => {
  return <CrudPage {...buildingsConfig} />;
};

export default Buildings;
