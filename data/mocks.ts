export type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
};

export const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'system initialized. connection secure.',
    sender: 'them',
    timestamp: '23:42:01',
  },
  {
    id: '2',
    text: 'did you get the payload?',
    sender: 'them',
    timestamp: '23:42:15',
  },
  {
    id: '3',
    text: 'downloading now. encryption key verified.',
    sender: 'me',
    timestamp: '23:42:45',
  },
  {
    id: '4',
    text: "good. we don't have much time before the trace completes.",
    sender: 'them',
    timestamp: '23:43:02',
  },
  {
    id: '5',
    text: "trace blocked. i'm routing through the proxy chain.",
    sender: 'me',
    timestamp: '23:43:18',
  },
];
