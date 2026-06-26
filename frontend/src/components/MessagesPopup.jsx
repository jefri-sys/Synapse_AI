import React from 'react';
import { X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import Messages from '../pages/messages/Messages';

export default function MessagesPopup({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="bg-surface-base rounded-2xl w-full max-w-[800px] max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-surface-border bg-surface-raised">
          <h3 className="font-bold text-text-primary">Messages</h3>
          <Button onClick={onClose} variant="ghost" shape="circular" className="p-1 text-text-tertiary hover:text-text-secondary">
            <X className="w-5 h-5"/>
          </Button>
        </div>
        <div className="flex-1 p-4 bg-surface-base overflow-y-auto">
          <Messages isPopupMode={true} />
        </div>
      </Card>
    </div>
  );
}
