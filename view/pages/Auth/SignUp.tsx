import { useReactiveVar } from '@apollo/client';
import { Typography } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import SignUpForm from '../../components/Auth/SignUpForm';
import ProgressBar from '../../components/Shared/ProgressBar';
import {
  LocalStorageKey,
  NavigationPaths,
} from '../../constants/shared.constants';
import {
  inviteTokenVar,
  isLoggedInVar,
  isVerifiedVar,
} from '../../graphql/cache';
import { useServerInviteLazyQuery } from '../../graphql/invites/queries/gen/ServerInvite.gen';
import { useIsVerifiedUserLazyQuery } from '../../graphql/users/queries/gen/IsVerifiedUser.gen';

const SignUp = () => {
  const isLoggedIn = useReactiveVar(isLoggedInVar);

  const [
    getServerInvite,
    { loading: serverInviteLoading, error: serverInviteError },
  ] = useServerInviteLazyQuery();

  const [getIsVerifiedUser] = useIsVerifiedUserLazyQuery();

  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      getServerInvite({
        variables: { token },
        onCompleted({ serverInvite }) {
          inviteTokenVar(serverInvite.token);
          localStorage.setItem(LocalStorageKey.InviteToken, serverInvite.token);
        },
      });
    }
  }, [token, navigate, getServerInvite]);

  useEffect(() => {
    if (isLoggedIn) {
      const handleRedirect = async () => {
        const { data } = await getIsVerifiedUser();
        if (data?.me.isVerified) {
          isVerifiedVar(true);
          navigate(NavigationPaths.Home);
        } else {
          navigate(NavigationPaths.VibeCheck);
        }
      };
      handleRedirect();
    }
  }, [isLoggedIn, navigate, getIsVerifiedUser]);

  if (serverInviteError) {
    return <Typography>{t('invites.prompts.expiredOrInvalid')}</Typography>;
  }
  if (serverInviteLoading || isLoggedIn) {
    return <ProgressBar />;
  }
  if (isLoggedIn) {
    return <Typography>{t('users.prompts.alreadyRegistered')}</Typography>;
  }
  if (!token) {
    return <Typography>{t('invites.prompts.inviteRequired')}</Typography>;
  }

  return <SignUpForm />;
};

export default SignUp;
