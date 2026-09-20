import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Music, RotateCcw, Sliders, ShieldAlert } from 'lucide-react';
import { SettingsManager, GameSettings } from '../game/SettingsManager';
import { SaveManager } from '../game/SaveManager';
import { AudioManager } from '../game/AudioManager';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const settingsManager = SettingsManager.getInstance();
  const saveManager = SaveManager.getInstance();
  const audio = AudioManager.getInstance();

  const [settings, setSettings] = useState<GameSettings>(settingsManager.getSettings());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    return settingsManager.subscribe((newSettings) => {
      setSettings(newSettings);
    });
  }, [settingsManager]);

  const update = (partial: Partial<GameSettings>) => {
    settingsManager.updateSettings(partial);
    audio.playClick();
  };

  const handleClearData = () => {
    saveManager.clearAllData();
    setShowClearConfirm(false);
    audio.playClick();
  };

  return (
    <div
      id="modal-settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#24133f] via-[#1c0e34] to-[#120824] border-2 border-amber-400/40 p-6 sm:p-7 shadow-2xl shadow-purple-950/80 text-white flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-extrabold text-amber-200">Festival Settings</h3>
          </div>
          <button
            id="btn-settings-close"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-amber-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {/* Sound FX */}
          <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-purple-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-bold text-amber-100">Sound Effects</span>
              </div>
              <button
                id="toggle-sound"
                onClick={() => update({ soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  settings.soundEnabled ? 'bg-amber-500 justify-end' : 'bg-gray-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
            {settings.soundEnabled && (
              <div className="flex items-center gap-3 mt-1">
                <input
                  id="slider-sound-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => update({ soundVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-amber-300 min-w-[32px] text-right">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Music */}
          <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-purple-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-bold text-amber-100">Ambient Music</span>
              </div>
              <button
                id="toggle-music"
                onClick={() => update({ musicEnabled: !settings.musicEnabled })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  settings.musicEnabled ? 'bg-pink-500 justify-end' : 'bg-gray-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
            {settings.musicEnabled && (
              <div className="flex items-center gap-3 mt-1">
                <input
                  id="slider-music-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => update({ musicVolume: parseFloat(e.target.value) })}
                  className="w-full accent-pink-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-pink-300 min-w-[32px] text-right">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Camera Sensitivity */}
          <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-purple-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-amber-100">Camera Orbit Sensitivity</span>
              <span className="text-xs font-mono text-amber-300">
                {settings.cameraSensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              id="slider-camera-sensitivity"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.cameraSensitivity}
              onChange={(e) => update({ cameraSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Invert Y */}
          <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-purple-500/20 flex items-center justify-between">
            <span className="text-sm font-bold text-amber-100">Invert Camera Pitch (Y)</span>
            <button
              id="toggle-invert-y"
              onClick={() => update({ invertY: !settings.invertY })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.invertY ? 'bg-amber-500 justify-end' : 'bg-gray-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Reset Defaults */}
          <div className="flex items-center justify-between pt-2">
            <button
              id="btn-reset-settings"
              onClick={() => {
                settingsManager.resetToDefaults();
                audio.playClick();
              }}
              className="flex items-center gap-1.5 text-xs text-amber-300/80 hover:text-amber-200 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Settings to Defaults</span>
            </button>
          </div>

          {/* Storage Clear Warning Section */}
          <div className="mt-2 pt-3 border-t border-amber-500/20">
            {!showClearConfirm ? (
              <button
                id="btn-prompt-clear-data"
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-800/30 transition-all cursor-pointer"
              >
                Clear High Scores & Save Data
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-600/50 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Are you sure? This erases all local festival records.</span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 rounded bg-indigo-900 text-xs text-amber-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-clear-data"
                    onClick={handleClearData}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Done button */}
        <button
          id="btn-settings-done"
          onClick={() => {
            audio.playClick();
            onClose();
          }}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-sm shadow-md hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer"
        >
          Close Settings
        </button>
      </div>
    </div>
  );
};
