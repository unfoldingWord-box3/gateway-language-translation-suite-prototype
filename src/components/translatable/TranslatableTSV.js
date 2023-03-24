import React, {
  useState,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useDeepCompareCallback, useDeepCompareMemo } from 'use-deep-compare';

import { DataTable } from 'datatable-translatable';
import { ResourcesContextProvider } from 'scripture-resources-rcl';
import * as parser from 'uw-tsv-parser';
import { MdUpdate } from 'react-icons/md'
import { FiShare } from 'react-icons/fi'
import IconButton from '@material-ui/core/IconButton';
import {
  defaultResourceLinks,
  stripDefaultsFromResourceLinks,
  generateAllResourceLinks,
} from '../../core/resourceLinks';
import { SERVER_URL } from '../../core/state.defaults';

import { AppContext } from '../../App.context';
import useValidation from '../../hooks/useValidation';
import RowHeader from './RowHeader';

import {
  columnNamesFromContent,
  columnsFilterFromColumnNames,
  columnsShowDefaultFromColumnNames,
  compositeKeyIndicesFromColumnNames,
  generateRowId,
} from './helpers';

import { getReferenceFilterOptions } from './referenceFilterOptions';

const delimiters = { row: '\n', cell: '\t' };

// override cache to 1 minute for scripture resources
const serverConfig = {
  server: SERVER_URL,
  cache: { maxAge: 1 * 1 * 1 * 60 * 1000 },
};

export default function TranslatableTSV({
  onSave,
  onEdit,
  onContentIsDirty,
}) {
  // manage the state of the resources for the provider context
  const [resources, setResources] = useState([]);

  const {
    state: {
      resourceLinks,
      expandedScripture,
      cachedFile,
      selectedFont,
    },
    actions: { setResourceLinks },
    giteaReactToolkit: {
      sourceFileHook,
      targetFileHook,
    },
  } = useContext(AppContext);

  const {
    filepath: sourceFilepath,
    content: sourceContent,
    publishedContent: releasedSourceContent,
  } = sourceFileHook.state || {};
  const { content: targetContent } = targetFileHook.state || {};
  const { content: cachedContent } = cachedFile || {};
  console.log("TranslatableTSV() sourceContent, publishedContent:", sourceContent, releasedSourceContent)
  const columnNames = useMemo(() => {
    const _content = sourceContent || releasedSourceContent;
    const _columnNames = columnNamesFromContent({ content: _content, delimiters });
    return _columnNames;
  }, [sourceContent, releasedSourceContent]);

  const {
    actions: { onValidate },
    component: validationComponent,
  } = useValidation({ columnCount: columnNames.length, delimiters });

  const bookId = sourceFilepath?.split(/.*[-_]/)[1].split('.')[0].toLowerCase();

  const onResourceLinks = useCallback((_resourceLinks) => {
    // Remove bookId and remove defaults:
    const persistedResourceLinks = stripDefaultsFromResourceLinks({
      resourceLinks: _resourceLinks,
      bookId,
    });
    // Persist to App context:
    setResourceLinks(persistedResourceLinks);
  }, [bookId, setResourceLinks]);

  // Build bookId and add defaults:
  const defaultResourceLinksWithBookId = generateAllResourceLinks({ bookId, defaultResourceLinks });
  const allResourceLinksWithBookId = generateAllResourceLinks({ bookId, resourceLinks });

  const _generateRowId = useDeepCompareCallback((rowData) => {
    const rowId = generateRowId({
      rowData,
      columnNames,
      delimiters,
    });
    return rowId;
  }, [columnNames, delimiters]);

  const options = {
    page: 0,
    rowsPerPage: 25,
    rowsPerPageOptions: [10, 25, 50, 100],
  };

  const rowHeader = useDeepCompareCallback((rowData, actionsMenu) => {
    const _props = {
      open: expandedScripture,
      rowData,
      actionsMenu,
      delimiters,
      columnNames,
      bookId,
    };
    return <RowHeader {..._props} />;
  }, [expandedScripture, delimiters, columnNames]);

  const config = useDeepCompareMemo(() => {
    let _config = {
      rowHeader,
      compositeKeyIndices: compositeKeyIndicesFromColumnNames({ columnNames }),
      columnsFilter: columnsFilterFromColumnNames({ columnNames }),
      columnsShowDefault: columnsShowDefaultFromColumnNames({ columnNames }),
    };

    return _config;
  }, [columnNames, rowHeader]);

   // TODO: hook these up to API
   const needToMergeFromMaster = true
   const mergeFromMasterHasConflicts = false
   const mergeToMasterHasConflicts = true
 
   // eslint-disable-next-line no-nested-ternary
   const mergeFromMasterTitle = mergeFromMasterHasConflicts ? 'Merge Conflicts for update from master' : (needToMergeFromMaster ? 'Update from master' : 'No merge conflicts for update with master')
   // eslint-disable-next-line no-nested-ternary
   const mergeFromMasterColor = mergeFromMasterHasConflicts ? 'red' : (needToMergeFromMaster ? 'orange' : 'lightgray')
   const mergeToMasterTitle = mergeToMasterHasConflicts ? 'Merge Conflicts for share with master' : 'No merge conflicts for share with master'
   const mergeToMasterColor = mergeToMasterHasConflicts ? 'red' : 'black'
 

  const onRenderToolbar = ({ items }) => 
  <>
    {items}
    <IconButton
      // className={classes.margin}
      key='update-from-master'
      onClick={() => { }}
      title={mergeFromMasterTitle}
      aria-label={mergeFromMasterTitle}
      style={{ cursor: 'pointer' }}
    >
      <MdUpdate id='update-from-master-icon' color={mergeFromMasterColor} />
    </IconButton>
    <IconButton
      // className={classes.margin}
      key='share-to-master'
      onClick={() => { }}
      title={mergeToMasterTitle}
      aria-label={mergeToMasterTitle}
      style={{ cursor: 'pointer' }}
    >
      <FiShare id='share-to-master-icon' color={mergeToMasterColor} />
    </IconButton>
    </>

  const columnsMap = {
    "Reference": {
      options: {
        ...getReferenceFilterOptions({
          fullWidth: config.columnsFilter.length > 1
        })
      }
    }
  }

  return (
    <ResourcesContextProvider
      reference={{ bookId }}
      defaultResourceLinks={defaultResourceLinksWithBookId}
      resourceLinks={allResourceLinksWithBookId}
      onResourceLinks={onResourceLinks}
      resources={resources}
      onResources={setResources}
      config={serverConfig}
    >
      <DataTable
        sourceFile={sourceContent || releasedSourceContent}
        targetFile={cachedContent || targetContent}
        onSave={onSave}
        onEdit={onEdit}
        onValidate={onValidate}
        onContentIsDirty={onContentIsDirty}
        delimiters={delimiters}
        config={config}
        generateRowId={_generateRowId}
        options={options}
        parser={parser}
        columnsMap={columnsMap}
        translationFontFamily={selectedFont}
        onRenderToolbar={onRenderToolbar}
      />
      {validationComponent}
    </ResourcesContextProvider>
  );
};

TranslatableTSV.propTypes = {
  /** function triggered for save */
  onSave: PropTypes.func.isRequired,
  /** function triggered on edit */
  onEdit: PropTypes.func.isRequired,
  /** function triggered if content is dirty */
  onContentIsDirty: PropTypes.func.isRequired,
};
