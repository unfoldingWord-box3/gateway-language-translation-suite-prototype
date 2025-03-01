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
import {
  defaultResourceLinks,
  stripDefaultsFromResourceLinks,
  generateAllResourceLinks,
  ORIGINAL_LANG_POSITION,
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
import { useContentUpdateProps } from '../../hooks/useContentUpdateProps';
import { UpdateBranchButton } from '../branch-merger/components/UpdateBranchButton';
import ErrorDialog from '../dialogs/ErrorDialog';
import { ToggleStickyHeadersButton } from './ToggleStickyHeadersButton';
import { useEventListeners } from '../../hooks/useEventListeners';

const delimiters = { row: '\n', cell: '\t' };

// override cache to 1 minute for scripture resources
const serverConfig = {
  server: SERVER_URL,
  cache: { maxAge: 1 * 1 * 1 * 60 * 1000 },
};

export default function TranslatableTSV({
  onSave: _onSave,
  onEdit,
  onContentIsDirty,
}) {
  // manage the state of the resources for the provider context
  const [resources, setResources] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { addEventListener, clearEventListeners } = useEventListeners();

  const {
    state: {
      resourceLinks,
      expandedScripture,
      cachedFile,
      selectedFont,
      targetRepository,
    },
    actions: { setResourceLinks },
    giteaReactToolkit: {
      sourceFileHook,
      targetFileHook,
    },
  } = useContext(AppContext);

  const organizationName = targetRepository?.full_name.split('/')[0]?.toLowerCase();

  const {
    filepath: sourceFilepath,
    content: sourceContent,
    publishedContent: releasedSourceContent,
  } = sourceFileHook.state || {};
  const { content: targetContent } = targetFileHook.state || {};
  const { content: cachedContent } = cachedFile || {};
  const columnNames = useMemo(() => {
    const _content = organizationName === "unfoldingword" ? sourceContent : releasedSourceContent;
    const _columnNames = columnNamesFromContent({ content: _content, delimiters });
    return _columnNames;
  }, [sourceContent, releasedSourceContent, organizationName ]);

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
    onCellClick: (colData, cellMeta) => {
      clearEventListeners();

      const { name: columnName } = colData.props.tableMeta.columnData;
      if (columnName !== "Quote") return;

      const quoteElement = cellMeta.event.target;
      if (!quoteElement?.addEventListener) return;

      // Prevent Enter key from creating new lines in Quote cells
      const handleQuoteKeyPress = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      addEventListener(quoteElement, 'keypress', handleQuoteKeyPress);
    }
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
      newRowDefaultValues: {
        SupportReference: ""
      }
    };
    return _config;
  }, [columnNames, rowHeader]);

  const updateButtonProps = useContentUpdateProps({isSaving});
  const {
    isErrorDialogOpen,
    onCloseErrorDialog,
    isLoading,
    dialogMessage,
    dialogTitle,
    dialogLink,
    dialogLinkTooltip
  } = updateButtonProps;

  const onRenderToolbar = ({ items }) => 
  <>
    <ToggleStickyHeadersButton />
    {items}
    <UpdateBranchButton {...updateButtonProps} isLoading={isLoading | isSaving}/>
    <ErrorDialog title={dialogTitle} content={dialogMessage} open={isErrorDialogOpen} onClose={onCloseErrorDialog} isLoading={isLoading | isSaving} link={dialogLink} linkTooltip={dialogLinkTooltip} />
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

  const onSave = async function(...args) {
    setIsSaving(true);
    await _onSave(...args)
    setIsSaving(false);
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
      ORIGINAL_LANG_POSITION={ORIGINAL_LANG_POSITION}
    >
      <DataTable
        sourceFile={organizationName === "unfoldingword" ? sourceContent : releasedSourceContent}
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
