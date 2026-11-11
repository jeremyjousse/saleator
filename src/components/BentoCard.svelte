<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    title?: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: 'green' | 'blue' | 'orange' | 'purple' | 'gray';
    variant?: 'default' | 'highlight' | 'lime' | 'sky' | 'amber';
    class?: string;
    children?: Snippet;
    headerAction?: Snippet;
  }

  let {
    title,
    subtitle,
    badge,
    badgeColor = 'gray',
    variant = 'default',
    class: className = '',
    children,
    headerAction,
  }: Props = $props();

  const variantClasses = $derived(() => {
    switch (variant) {
      case 'lime':
        return 'bg-lime-100/90 dark:bg-lime-950/40 border-lime-200/80 dark:border-lime-800/40 text-lime-950 dark:text-lime-200';
      case 'sky':
        return 'bg-sky-100/80 dark:bg-sky-950/40 border-sky-200/80 dark:border-sky-800/40 text-sky-950 dark:text-sky-200';
      case 'amber':
        return 'bg-amber-100/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/40 text-amber-950 dark:text-amber-200';
      case 'highlight':
        return 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/40 text-indigo-950 dark:text-indigo-200';
      default:
        return 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100';
    }
  });

  const badgeClasses = $derived(() => {
    switch (badgeColor) {
      case 'green':
        return 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300';
      case 'blue':
        return 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300';
      case 'orange':
        return 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  });
</script>

<div
  class={cn(
    'relative flex flex-col justify-between rounded-3xl p-5 shadow-sm border transition-all duration-200',
    variantClasses(),
    className,
  )}
>
  {#if title || badge || headerAction}
    <div class="flex items-center justify-between gap-2 mb-3">
      <div class="flex flex-col">
        {#if title}
          <h3 class="text-base font-bold tracking-tight">{title}</h3>
        {/if}
        {#if subtitle}
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">{subtitle}</span>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        {#if badge}
          <span class={cn('px-2.5 py-1 text-xs font-semibold rounded-full', badgeClasses())}>
            {badge}
          </span>
        {/if}
        {#if headerAction}
          {@render headerAction()}
        {/if}
      </div>
    </div>
  {/if}

  {#if children}
    <div class="flex-1">
      {@render children()}
    </div>
  {/if}
</div>
