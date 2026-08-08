import React from 'react';
import clsx from 'clsx';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import styles from './styles.module.css';

export default function BlogPostItemContainer({children, className}) {
  const {isBlogPostPage} = useBlogPost();
  return (
    <article
      className={clsx(!isBlogPostPage && styles.listCard, className)}>
      {children}
    </article>
  );
}
