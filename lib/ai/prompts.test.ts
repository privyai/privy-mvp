import { describe, it, expect } from 'vitest';
import {
    regularPrompt,
    getCoachingPrompt,
    titlePrompt,
    type CoachingMode
} from './prompts';

describe('Privy Coaching Prompts', () => {
    describe('regularPrompt', () => {
        it('should contain Privy identity', () => {
            expect(regularPrompt).toContain('Privy');
            expect(regularPrompt).toContain('private');
            expect(regularPrompt).toContain('anonymous');
        });

        it('should mention all three coaching modes', () => {
            expect(regularPrompt).toContain('Venting');
            expect(regularPrompt).toContain('Decision-making');
            expect(regularPrompt).toContain('Reframing');
        });

        it('should clarify this is not therapy', () => {
            expect(regularPrompt).toContain('NOT a therapist');
        });
    });

    describe('getCoachingPrompt', () => {
        it('should return vent prompt for vent mode', () => {
            const prompt = getCoachingPrompt('vent');
            expect(prompt).toContain('MODE: VENT');
            expect(prompt).toContain('emotional decompression');
            expect(prompt).toContain('judgment-free');
        });

        it('should return decision prompt for decision mode', () => {
            const prompt = getCoachingPrompt('decision');
            expect(prompt).toContain('MODE: DECISION LAB');
            expect(prompt).toContain('frameworks');
            expect(prompt).toContain('tradeoffs');
        });

        it('should return reframe prompt for reframe mode', () => {
            const prompt = getCoachingPrompt('reframe');
            expect(prompt).toContain('MODE: REFRAME');
            expect(prompt).toContain('perspective');
            expect(prompt).toContain('cognitive');
        });

        it('should fallback to regularPrompt for unknown mode', () => {
            const prompt = getCoachingPrompt('unknown' as CoachingMode);
            expect(prompt).toBe(regularPrompt);
        });
    });

    describe('titlePrompt', () => {
        it('should specify short title requirements', () => {
            expect(titlePrompt).toContain('short');
            expect(titlePrompt).toContain('2-4 words');
        });

        it('should require privacy protection', () => {
            expect(titlePrompt).toContain('No personal identifying information');
        });
    });

    describe('Prompt Quality Checks', () => {
        const modes: CoachingMode[] = ['vent', 'decision', 'reframe'];

        modes.forEach((mode) => {
            it(`${mode} prompt should include Privy identity`, () => {
                const prompt = getCoachingPrompt(mode);
                expect(prompt).toContain('Privy');
                expect(prompt).toContain('founders and leaders');
            });

            it(`${mode} prompt should have clear guidelines`, () => {
                const prompt = getCoachingPrompt(mode);
                expect(prompt).toContain('GUIDELINES:');
            });

            it(`${mode} prompt should specify tone`, () => {
                const prompt = getCoachingPrompt(mode);
                expect(prompt).toContain('TONE:');
            });
        });
    });
});
