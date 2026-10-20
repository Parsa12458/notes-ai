'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import CopyButton from '@/components/CopyButton';

export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`note-content text-right text-gray-800 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            const codeString = String(children).replace(/\n$/, '');
            if (isInline) {
              return (
                <code className="bg-gray-100 text-primary-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className="relative group my-4">
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={codeString} label="کپی کد" />
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono direction-ltr text-left">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full border-collapse" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-r-4 border-primary-400 bg-primary-50/60 pr-4 py-3 pl-4 my-4 rounded-xl text-primary-900" {...props}>
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

