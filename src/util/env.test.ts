import {requireEnv} from './env';

describe('env', () => {

    describe('requireEnv', () => {

        it('returns env var when set', () => {
            process.env['SET_VAR'] = 'set value';
            expect(requireEnv('SET_VAR')).toBe('set value');
        });

        it('throws when env var not set', () => {
            expect(() => requireEnv('NO_SUCH_VAR')).toThrow('env var NO_SUCH_VAR must be set')
        })

    })

})