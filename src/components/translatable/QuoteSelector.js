import React, { useContext } from 'react';
import { MuiThemeProvider } from '@material-ui/core/styles';
//import { ParallelScripture, withResources } from 'scripture-resources-rcl';
import {ParallelScripture, ResourcesContext} 
  from "scripture-resources-rcl";
import { getMuiTheme } from './muiTheme';

//const ParallelScriptureWithResources = withResources(ParallelScripture);

function QuoteSelector({
  quote,
  onQuote,
  occurrence: _occurrence,
  reference,
  buttons,
}) {
  const occurrence = (_occurrence == "\\-1") ? -1 : _occurrence;

  const { state: resources } = useContext(ResourcesContext);

  return (
    <MuiThemeProvider theme={getMuiTheme}>
        <ParallelScripture
          resources={resources}
          reference={reference}
          quote={quote}
          onQuote={onQuote}
          occurrence={occurrence}
          height='250px'
          buttons={buttons}
        />
    </MuiThemeProvider>
  );
};

export default QuoteSelector;

/*
        <ParallelScriptureWithResources
          resourceLinks={resourceLinks}
          config={config}
          reference={reference}
          quote={quote}
          onQuote={onQuote}
          occurrence={occurrence}
          height='250px'
          buttons={buttons}
        />
*/