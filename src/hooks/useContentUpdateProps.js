import { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../App.context';
import { useBranchMergerContext } from '../components/branch-merger/context/BranchMergerContext';

export function useContentUpdateProps({isLoading: _isLoading = false, isSaving = false} = {}) {
  const [isLoading, setIsLoading] = useState(_isLoading);
  const [isErrorDialogOpen,setIsErrorDialogOpen] = useState(false);

  const {
    state: { updateStatus, loadingUpdate }, actions: { updateUserBranch, checkUpdateStatus }
  } = useBranchMergerContext();

  console.log("updateStatus", updateStatus)

  const {
    state: { contentIsDirty },
    giteaReactToolkit: {
      targetFileHook,
    },
  } = useContext(AppContext);

  const loadingProps = { color: loadingUpdate ? "primary" : "secondary" };

  const { load: loadTargetFile } = targetFileHook.actions || {};

  useEffect(() => {
    if(isSaving & !isLoading) {
      setIsLoading(true);
    }
    if (!isSaving & isLoading) {
      // There is a race condition with server returning
      // a conflict while processing the last commit
      // the setTimeout tries to make sure we don't get a false conflict
      setTimeout(() => {
        checkUpdateStatus().then((status) => {
          if (status.conflict)
            checkUpdateStatus();
        });
        setIsLoading(false);
      },1000)
    }
  },[isSaving,isLoading,checkUpdateStatus])

  const  {conflict,mergeNeeded,error,message,pullRequest} = updateStatus
  const pending = mergeNeeded || conflict
  const blocked = conflict || contentIsDirty || error;

  const {message: dialogMessage, title: dialogTitle, link: dialogLink} = useMemo(() => {
    if (conflict) return {
      title: "Conflict Error",
      message: "It appears that someone has merged changes that conflict with your current merge request. Please contact your administrator.",
      link: pullRequest
    };
    if (error && message) return {
      title: "Error",
      message,
      link: pullRequest
    };
    if (error && !message) return {
      title: "Unknown error.",
      message: "Contact your administrator.",
      link: pullRequest
    };
    if (contentIsDirty) return {
      title: "Unsaved content",
      message: "Please save and try again",
      link: ""
    };
    if (!mergeNeeded) return  {
      title: "Up-to-date",
      message: "Your content is already up-to-date",
      link: ""
    };
    return {
      title: "Unknown state.",
      message: "Contact your administrator.",
      link: pullRequest
    };
  }, [message,contentIsDirty,conflict,mergeNeeded,error,pullRequest])

  const dialogLinkTooltip = "Pull-Request URL"

  const onCloseErrorDialog = () => {
    setIsErrorDialogOpen(false)
  }

  const onClick = () => {
    if (blocked || !pending) return setIsErrorDialogOpen(true)
    setIsLoading(true);
    updateUserBranch().then((response) => {
      if (response.success && response.message === "") loadTargetFile()
      else { 
        setIsErrorDialogOpen(true);
        setIsLoading(false)
      };
    })
  }

  return {
    isLoading: (isLoading | loadingUpdate),
    onClick,
    isErrorDialogOpen,
    onCloseErrorDialog,
    dialogMessage,
    dialogTitle,
    dialogLink,
    dialogLinkTooltip,
    pending,
    blocked,
    loadingProps
  }
}
