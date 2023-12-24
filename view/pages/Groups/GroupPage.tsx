import { useReactiveVar } from '@apollo/client';
import { Card, CardContent, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import GroupEventsTab from '../../components/Groups/GroupEventsTab';
import GroupProfileCard from '../../components/Groups/GroupProfileCard';
import Feed from '../../components/Shared/Feed';
import ProgressBar from '../../components/Shared/ProgressBar';
import ToggleForms from '../../components/Shared/ToggleForms';
import { isLoggedInVar } from '../../graphql/cache';
import { useGroupProfileLazyQuery } from '../../graphql/groups/queries/gen/GroupProfile.gen';
import { isDeniedAccess } from '../../utils/error.utils';
import { urlifyText } from '../../utils/shared.utils';

const GroupPage = () => {
  const isLoggedIn = useReactiveVar(isLoggedInVar);
  const [tab, setTab] = useState(0);

  const [getGroup, { data, loading, error }] = useGroupProfileLazyQuery({
    errorPolicy: 'all',
  });

  const { name } = useParams();
  const { t } = useTranslation();

  useEffect(() => {
    if (name) {
      getGroup({
        variables: { name, isLoggedIn },
      });
    }
  }, [name, isLoggedIn, getGroup]);

  if (loading) {
    return <ProgressBar />;
  }

  if (!data) {
    if (isDeniedAccess(error)) {
      return <Typography>{t('prompts.permissionDenied')}</Typography>;
    }

    if (error) {
      return <Typography>{t('errors.somethingWentWrong')}</Typography>;
    }
    return null;
  }

  const { group, me } = data;
  const description = urlifyText(group.description);

  return (
    <>
      <GroupProfileCard
        currentUserId={me?.id}
        group={group}
        setTab={setTab}
        tab={tab}
      />

      {tab === 0 && (
        <>
          {me && group.isJoinedByMe && (
            <ToggleForms groupId={group.id} me={me} />
          )}
          <Feed feed={group.feed} />
        </>
      )}

      {tab === 1 && <GroupEventsTab groupId={group.id} />}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('groups.tabs.about')}
            </Typography>

            <Typography
              dangerouslySetInnerHTML={{
                __html: description || t('groups.prompts.noAboutText'),
              }}
              whiteSpace="pre-wrap"
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default GroupPage;
