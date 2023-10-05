import { useEffect, useState } from 'react';
import { GET_BACKGROUND_JOB, SET_BACKGROUND_JOB, WAIT } from '../services/api.service';
import { Card, Switch, message, notification } from 'antd';

export function BackgroundJobChange(): JSX.Element {
    const [backgroundJob, setBackgroundJob] = useState(false);
    const [backgroundJobButtonDisabled, setBackgroundJobButtonDisabled] = useState(false);
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [notificationApi, contextHolder] = notification.useNotification();

    const getBackgroundJob = async () => await GET_BACKGROUND_JOB()
        .then(
            ({ state }: { state: boolean }) => {
                setBackgroundJob(state);

            }
        ).then(
            async () => {
                await WAIT(2000);
                notificationApi.open({
                    message: 'Success',
                    description: 'Background job state with server successfully synchronised!',
                    duration: 5,
                });
            }
        ).catch(
            () => {
                notificationApi.open({
                    message: 'Error',
                    description: 'Background job state with server not synchronised. Try again later!',
                    duration: 5,
                });
            }
        );

    const onChange = async (newState: boolean) => {
        setBackgroundJob(newState);

        setBackgroundJobButtonDisabled(true);

        notificationApi.open({
            message: 'Updates',
            description: 'Background state being updated!',
            duration: 5
        });

        await WAIT(2000);

        await SET_BACKGROUND_JOB(newState)
            .then(
                () => {
                    messageApi.open({
                        type: 'success',
                        content: 'Background state updated!',
                        duration: 5,
                    });
                }
            )
            .catch(
                () => {
                    notificationApi.open({
                        message: 'Error',
                        description: 'Background job state with server not synchronised. Try again later!',
                        duration: 5,
                    });
                }
            );

        await getBackgroundJob();

        await WAIT(1000);

        setBackgroundJobButtonDisabled(false);
    };

    useEffect(() => {
        const getData = async () => await getBackgroundJob();

        notificationApi.open({
            message: 'Hang tight!',
            description: 'Synchronising background job state with server',
            duration: 5
        });

        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {contextHolder}
            {contextHolderMessage}
            <Card title={'Background Job'}>
                <h4 style={{ marginTop: 0 }}>
                    Enable/disable the background job to run at midnight
                </h4>
                <Switch
                    style={{ marginTop: 10 }}
                    checked={backgroundJob}
                    onChange={onChange}
                    disabled={backgroundJobButtonDisabled} />
            </Card>
        </>
    );
}