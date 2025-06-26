import React, { useState } from 'react';
import { Users, Share2, Copy, Check, UserPlus, Crown, Eye } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';

export const CollaborationPanel: React.FC = () => {
  const { users, currentUser, addUser, removeUser } = useCanvasStore();
  const [shareUrl] = useState(`https://hexacanvas.app/session/${Math.random().toString(36).substr(2, 9)}`);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const inviteUser = () => {
    if (inviteEmail.trim()) {
      const newUser = {
        id: `user-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
      addUser(newUser);
      setInviteEmail('');
    }
  };

  const allUsers = [currentUser, ...users];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Users size={16} />
        Collaboration
      </h3>

      {/* Share Section */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Share Session</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 font-mono"
          />
          <button
            onClick={copyShareUrl}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check size={16} />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Anyone with this link can view and edit your canvas
        </p>
      </div>

      {/* Invite Section */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Invite Collaborator</h4>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && inviteUser()}
          />
          <button
            onClick={inviteUser}
            disabled={!inviteEmail.trim()}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus size={16} />
          </button>
        </div>
      </div>

      {/* Active Users */}
      <div>
        <h4 className="text-xs font-semibold text-gray-600 mb-2">
          Active Users ({allUsers.length})
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {allUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {user.name}
                  </span>
                  {user.id === currentUser.id && (
                    <Crown size={12} className="text-yellow-500" title="You" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span>{user.id === currentUser.id ? 'You' : 'Collaborator'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Eye size={12} />
                  <span>Online</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Connected</span>
          </div>
          <div className="text-gray-500">
            Real-time sync active
          </div>
        </div>
      </div>

      {/* Demo Note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Demo Mode:</strong> Collaboration features are simulated. 
          In production, this connects to Bolt.new's real-time infrastructure.
        </p>
      </div>
    </div>
  );
};