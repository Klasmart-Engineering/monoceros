import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './app/app';

const id = 'root'
const rootElement = document.getElementById(id);
if(!rootElement) {
  console.log(`Could not find element with id '${id}'`)
} else {
  const root = ReactDOM.createRoot(rootElement);
  console.log('Render root')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );  
} 
