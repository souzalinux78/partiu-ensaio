import React, { useState } from 'react';
import { getBaseUrl } from '../utils/api';

/**
 * Componente de imagem com fallback automático para placeholder
 * - Tenta carregar a imagem original
 * - Se falhar (404), exibe placeholder silenciosamente
 * - Evita logs de erro desnecessários no console
 * - Previne múltiplas tentativas infinitas
 */
const ImageWithFallback = ({ 
  src, 
  alt = 'Imagem', 
  className = '', 
  placeholder = null,
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Placeholder padrão (SVG inline para não depender de arquivo externo)
  const defaultPlaceholder = (
    <svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ backgroundColor: '#f5f5f5' }}
    >
      <rect width="200" height="200" fill="#f5f5f5" />
      <circle cx="100" cy="80" r="30" fill="#ddd" />
      <path d="M 50 140 L 150 140" stroke="#ddd" strokeWidth="3" strokeLinecap="round" />
      <path d="M 70 160 L 130 160" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const handleError = (e) => {
    // Prevenir loop infinito: se já tentou, não tentar novamente
    if (imageError) {
      return;
    }

    setImageError(true);
    setIsLoading(false);

    // Chamar callback personalizado se fornecido
    if (onError) {
      onError(e);
    }

    // Não logar erro crítico no console (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.debug('[ImageWithFallback] Imagem não encontrada, usando placeholder:', src);
    }
  };

  const handleLoad = (e) => {
    setIsLoading(false);
    
    // Chamar callback personalizado se fornecido
    if (onLoad) {
      onLoad(e);
    }
  };

  // Se já houve erro, exibir placeholder
  if (imageError) {
    return (
      <div 
        className={`image-placeholder ${className}`}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          minHeight: '150px'
        }}
        aria-label={alt}
      >
        {placeholder || defaultPlaceholder}
      </div>
    );
  }

  // Construir URL completa
  const imageUrl = src?.startsWith('http') ? src : `${getBaseUrl()}${src}`;

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
      style={{
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
      {...props}
    />
  );
};

export default ImageWithFallback;
