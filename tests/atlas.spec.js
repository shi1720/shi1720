import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { projects } from '../atlas/projects.js';

test('the atlas renders without errors and filters the map and directory together', async ({ page }) => {
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto('/atlas/');
  await expect(page.locator('.project-card')).toHaveCount(projects.length);
  await page.getByRole('button',{name:'Agent infrastructure',exact:true}).click();
  await expect(page.locator('.project-card')).toHaveCount(projects.filter(p=>p.district==='agents').length);
  await expect(page.getByRole('button',{name:'Agent infrastructure',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('searchbox').fill('toolstorm');
  await expect(page.locator('.project-card')).toHaveCount(1);
  await expect(page.locator('#project-name')).toHaveText('Toolstorm');
  await page.getByRole('searchbox').fill('no-such-repository');
  await expect(page.getByRole('status')).toContainText('No projects match');
  await expect(page.locator('#next')).toBeDisabled();
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button',{name:'All districts',exact:true}).click();
  await expect(page.locator('.project-card')).toHaveCount(projects.length);
  expect(errors).toEqual([]);
});

test('keyboard selection opens the correct source and persists as a deep link', async ({ page }) => {
  await page.goto('/atlas/');
  const locate=page.getByRole('button',{name:'Locate Casecrop in atlas',exact:true});
  await locate.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#project-name')).toHaveText('Casecrop');
  await expect(page.locator('#project-source')).toHaveAttribute('href','https://github.com/shi1720/casecrop');
  await expect(page.locator('#project-source')).toBeFocused();
  await page.reload();
  await expect(page.locator('#project-name')).toHaveText('Casecrop');
  await page.getByRole('button',{name:'Select next project'}).click();
  await expect(page.locator('#project-name')).not.toHaveText('Casecrop');
});

test('reduced motion starts paused and all narrow-screen controls remain available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.setViewportSize({width:320,height:740});
  await page.goto('/atlas/');
  await expect(page.getByRole('button',{name:'Resume orbit'})).toHaveAttribute('aria-pressed','true');
  const before=await page.locator('#coordinates').textContent();
  await page.waitForTimeout(300);
  expect(await page.locator('#coordinates').textContent()).toBe(before);
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await page.getByRole('button',{name:'Reset view',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#project-source')).toBeVisible();
});

test('page has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/atlas/');
  const result=await new AxeBuilder({page}).analyze();
  expect(result.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
});
