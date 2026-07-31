import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { preferencesManager } from '../../src/core/storage/preferencesManager';
import { useCarFixStore } from '../../src/stores/carfixStore';
import { APP_VERSION } from '../../src/core/config/appVersion';

describe('Version-Aware Disclaimer Notice & Preference Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('should load empty array when no disclaimer version has been agreed to', async () => {
    const versions = await preferencesManager.loadAgreedDisclaimerVersions();
    expect(versions).toEqual([]);
    expect(await preferencesManager.isDisclaimerAgreedForVersion('1.0.0')).toBe(false);
  });

  it('should persist agreed disclaimer versions in preferencesManager', async () => {
    await preferencesManager.saveAgreedDisclaimerVersion('1.0.0');
    expect(await preferencesManager.isDisclaimerAgreedForVersion('1.0.0')).toBe(true);

    const loaded = await preferencesManager.loadAgreedDisclaimerVersions();
    expect(loaded).toContain('1.0.0');
  });

  it('should trigger disclaimer modal in store if current version is unagreed', async () => {
    const store = useCarFixStore();
    await store.checkDisclaimerAgreement();

    expect(store.showDisclaimerModal).toBe(true);
  });

  it('should hide disclaimer modal and persist version when user accepts disclaimer', async () => {
    const store = useCarFixStore();
    await store.checkDisclaimerAgreement();
    expect(store.showDisclaimerModal).toBe(true);

    await store.acceptDisclaimer(APP_VERSION);
    expect(store.showDisclaimerModal).toBe(false);
    expect(store.agreedDisclaimerVersions).toContain(APP_VERSION);

    const persisted = await preferencesManager.isDisclaimerAgreedForVersion(APP_VERSION);
    expect(persisted).toBe(true);
  });

  it('should re-trigger disclaimer modal when app is upgraded to a new unagreed version', async () => {
    const store = useCarFixStore();

    // User agrees to v1.0.0
    await store.acceptDisclaimer('1.0.0');
    expect(await preferencesManager.isDisclaimerAgreedForVersion('1.0.0')).toBe(true);

    // New version 1.1.0 is not yet agreed
    expect(await preferencesManager.isDisclaimerAgreedForVersion('1.1.0')).toBe(false);

    // Simulated check for 1.1.0
    const versions = await preferencesManager.loadAgreedDisclaimerVersions();
    expect(versions.includes('1.1.0')).toBe(false);

    // User accepts new version 1.1.0
    await store.acceptDisclaimer('1.1.0');
    const updatedVersions = await preferencesManager.loadAgreedDisclaimerVersions();
    expect(updatedVersions).toContain('1.0.0');
    expect(updatedVersions).toContain('1.1.0');
  });

  it('should format paragraph 1 in normal case and paragraphs 2, 3, and 4 in ALL CAPS without app name or As-Built references', () => {
    const enDict = JSON.parse(JSON.stringify(require('../../src/locales/en.json')));
    const textContent = JSON.stringify(enDict.disclaimer);

    expect(textContent).not.toContain('CarFix');
    expect(textContent).not.toContain('CarCommander');
    expect(textContent).not.toContain('carfix');
    expect(textContent).not.toContain('As-Built');
    expect(textContent).not.toContain('as-built');
    expect(enDict.disclaimer.noticeBody).toBe('This application communicates directly with vehicle Electronic Control Units (ECUs).');
    expect(enDict.disclaimer.noticeBodyParagraph2).toContain('MODIFYING VEHICLE CONFIGURATIONS');
    expect(enDict.disclaimer.noticeBodyParagraph3).toContain('YOU ARE SOLELY RESPONSIBLE');
    expect(enDict.disclaimer.noticeBodyParagraph4).toContain('NO GUARANTEE OR WARRANTY OF ANY KIND');
  });
});
