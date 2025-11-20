import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { v4 as uuidv4 } from 'uuid';

import { INITIAL_MESSAGES, Message } from '@/data/mocks';

export default function useMessage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const getAllMessages = () => {
    // get data from arkiv

    setMessages(INITIAL_MESSAGES);
  };

  const sendMessage = (text: string, sender: Address) => {
    if (!text.trim()) return;

    const metadata = {
      id: uuidv4(),
      sender,
      timestamp: new Date(),
    };

    const message = {
      ...metadata,
      text,
    };

    // arkiv entity update
  };

  useEffect(() => {
    getAllMessages();
  }, []);

  return {
    messages,
    sendMessage,
  };
}
