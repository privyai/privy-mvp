import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the @ai-sdk/fireworks module
vi.mock('@ai-sdk/fireworks', () => ({
    createFireworks: vi.fn(() => {
        return vi.fn((modelId: string) => ({
            modelId,
            provider: 'fireworks',
        }));
    }),
}));

import { getLanguageModel, getTitleModel, getArtifactModel } from './providers';

describe('Privy AI Providers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getLanguageModel', () => {
        it('should return a model instance', () => {
            const model = getLanguageModel();
            expect(model).toBeDefined();
        });

        it('should use gemma-3-4b-it model', () => {
            const model = getLanguageModel();
            expect(model.modelId).toBe('accounts/fireworks/models/gemma-3-4b-it');
        });

        it('should ignore modelId parameter (single model for Privy)', () => {
            const model = getLanguageModel('some-other-model');
            expect(model.modelId).toBe('accounts/fireworks/models/gemma-3-4b-it');
        });
    });

    describe('getTitleModel', () => {
        it('should return a model instance', () => {
            const model = getTitleModel();
            expect(model).toBeDefined();
        });

        it('should use the same Privy model', () => {
            const model = getTitleModel();
            expect(model.modelId).toBe('accounts/fireworks/models/gemma-3-4b-it');
        });
    });

    describe('getArtifactModel', () => {
        it('should return a model instance', () => {
            const model = getArtifactModel();
            expect(model).toBeDefined();
        });

        it('should use the same Privy model', () => {
            const model = getArtifactModel();
            expect(model.modelId).toBe('accounts/fireworks/models/gemma-3-4b-it');
        });
    });

    describe('Model Consistency', () => {
        it('all model functions should return same model type', () => {
            const langModel = getLanguageModel();
            const titleModel = getTitleModel();
            const artifactModel = getArtifactModel();

            expect(langModel.modelId).toBe(titleModel.modelId);
            expect(titleModel.modelId).toBe(artifactModel.modelId);
        });
    });
});
