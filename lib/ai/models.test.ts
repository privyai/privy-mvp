import { describe, it, expect } from 'vitest';
import { chatModels, DEFAULT_CHAT_MODEL, modelsByProvider } from './models';

describe('Privy Chat Models', () => {
  describe('DEFAULT_CHAT_MODEL', () => {
    it('should be the Fireworks gemma model', () => {
      expect(DEFAULT_CHAT_MODEL).toBe('accounts/fireworks/models/gemma-3-4b-it');
    });
  });

  describe('chatModels', () => {
    it('should have at least one model', () => {
      expect(chatModels.length).toBeGreaterThan(0);
    });

    it('should include the Privy Coach model', () => {
      const privyModel = chatModels.find(m => m.name === 'Privy Coach');
      expect(privyModel).toBeDefined();
      expect(privyModel?.provider).toBe('fireworks');
    });

    it('all models should have required fields', () => {
      chatModels.forEach((model) => {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(model.description).toBeDefined();
      });
    });
  });

  describe('modelsByProvider', () => {
    it('should group models by provider', () => {
      expect(modelsByProvider).toBeDefined();
      expect(typeof modelsByProvider).toBe('object');
    });

    it('should have fireworks provider', () => {
      expect(modelsByProvider['fireworks']).toBeDefined();
      expect(modelsByProvider['fireworks'].length).toBeGreaterThan(0);
    });
  });
});
