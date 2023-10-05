import { Button, Card, Input, List, message } from 'antd';
import { useEffect, useState } from 'react';
import { ADD_WORD, DELETE_WORD, GET_FILTERED_WORDS } from '../services/api.service';

export const FilteredWords = ({ sync }: { sync: boolean }) => {
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [filteredWordsList, setFilteredWordsList] = useState<string[]>([]);
    const [addWord, setAddWord] = useState<string>('');

    const getFilteredWords = async () => {
        await GET_FILTERED_WORDS().then(
            (words: string[]) => {
                setFilteredWordsList(words);
            }
        ).catch(
            () => {
                messageApi.open({
                    type: 'error',
                    content: `server not responsing.`,
                    duration: 5,
                });
            }
        );
    };

    const addNewWord = async (newWord: string) => {
        await ADD_WORD(newWord)
            .then(
                () => {
                    messageApi.open({
                        type: 'success',
                        content: `'${newWord}' added to filtered list`,
                        duration: 5,
                    });
                    setAddWord('');

                    return getFilteredWords();
                }
            )
            .catch(
                () => {
                    messageApi.open({
                        type: 'error',
                        content: `cannot add '${newWord}' to list`,
                        duration: 5,
                    });
                }
            );
    }

    const deleteWord = async (word: string) => {
        await DELETE_WORD(word)
            .then(
                () => {
                    messageApi.open({
                        type: 'success',
                        content: `'${word}' delete from filtered words list`,
                        duration: 5,
                    });

                    return getFilteredWords();
                }
            )
            .catch(
                () => {
                    messageApi.open({
                        type: 'error',
                        content: `cannot delete '${word}' from list`,
                        duration: 5,
                    });
                }
            );
    }

    useEffect(() => {
        if (sync)
            getFilteredWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sync])

    return (
        <Card title={'Filtered words list'} style={{ marginLeft: 100, width: 300 }}>
            <div>
                {contextHolderMessage}
                {
                    filteredWordsList.length > 0 &&
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Input
                                placeholder='Add word'
                                onKeyDown={(event) => event.key === 'Enter' ? addNewWord(addWord) : null}
                                value={addWord}
                                onChange={(event) => setAddWord(event.target.value)}
                            />
                            <Button
                                type='primary'
                                style={{ marginLeft: 10 }}
                                onClick={() => addNewWord(addWord)}>
                                Add
                            </Button>
                        </div>
                        <div style={{ maxHeight: 200, overflow: 'auto', marginTop: 10 }}>
                            <List
                                size='small'
                                bordered
                                dataSource={filteredWordsList}
                                renderItem={(item, index) =>
                                    <List.Item style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            {index + 1}. {item}
                                        </div>
                                        <Button shape='circle' onClick={() => deleteWord(item)} >&#x2715;</Button>
                                    </List.Item>
                                }
                            />
                        </div>
                    </>
                    ||
                    <Button style={{ marginTop: 20 }} type='primary' size='large' onClick={getFilteredWords} >
                        Get words
                    </Button>
                }
            </div>
        </Card>
    )
}