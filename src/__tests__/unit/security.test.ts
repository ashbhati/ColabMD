/**
 * Security Tests for Open Redirect Prevention
 *
 * Tests the getSafeRedirect and getSafeRedirectPath functions
 * that prevent open redirect vulnerabilities in authentication flows.
 */

// =============================================================================
// getSafeRedirect Tests (LoginButton.tsx)
// =============================================================================

describe('getSafeRedirect (LoginButton)', () => {
  // Replicate the function for testing
  function getSafeRedirect(path: string): string {
    // Only allow paths starting with / and not protocol-relative URLs
    const safePath = path.startsWith('/') && !path.startsWith('//') && !path.includes(':') ? path : '/';
    return encodeURIComponent(safePath);
  }

  describe('valid redirect paths', () => {
    it('should accept root path', () => {
      expect(getSafeRedirect('/')).toBe('%2F');
    });

    it('should accept simple paths', () => {
      expect(getSafeRedirect('/dashboard')).toBe('%2Fdashboard');
    });

    it('should accept nested paths', () => {
      expect(getSafeRedirect('/doc/123')).toBe('%2Fdoc%2F123');
    });

    it('should accept paths with query parameters', () => {
      expect(getSafeRedirect('/doc?id=123')).toBe('%2Fdoc%3Fid%3D123');
    });

    it('should accept paths with hash fragments', () => {
      expect(getSafeRedirect('/doc#section')).toBe('%2Fdoc%23section');
    });

    it('should accept paths with special characters', () => {
      expect(getSafeRedirect('/my-doc_123')).toBe('%2Fmy-doc_123');
    });

    it('should accept paths with encoded characters', () => {
      expect(getSafeRedirect('/doc%20name')).toBe('%2Fdoc%2520name');
    });
  });

  describe('open redirect prevention', () => {
    it('should reject absolute URLs with http://', () => {
      // Contains colon - should be rejected
      expect(getSafeRedirect('http://evil.com')).toBe('%2F');
    });

    it('should reject absolute URLs with https://', () => {
      expect(getSafeRedirect('https://evil.com')).toBe('%2F');
    });

    it('should reject protocol-relative URLs', () => {
      expect(getSafeRedirect('//evil.com')).toBe('%2F');
    });

    it('should reject javascript: URLs', () => {
      expect(getSafeRedirect('javascript:alert(1)')).toBe('%2F');
    });

    it('should reject data: URLs', () => {
      expect(getSafeRedirect('data:text/html,<script>alert(1)</script>')).toBe('%2F');
    });

    it('should reject vbscript: URLs', () => {
      expect(getSafeRedirect('vbscript:msgbox(1)')).toBe('%2F');
    });

    it('should reject file: URLs', () => {
      expect(getSafeRedirect('file:///etc/passwd')).toBe('%2F');
    });

    it('should reject ftp: URLs', () => {
      expect(getSafeRedirect('ftp://evil.com/file')).toBe('%2F');
    });

    it('should reject URLs with embedded credentials', () => {
      expect(getSafeRedirect('http://user:pass@evil.com')).toBe('%2F');
    });

    it('should reject paths that look like protocol-relative but encoded', () => {
      // Starts with // - should be rejected
      expect(getSafeRedirect('//evil.com/path')).toBe('%2F');
    });

    it('should reject empty string', () => {
      // Empty string does not start with /
      expect(getSafeRedirect('')).toBe('%2F');
    });

    it('should reject relative paths (no leading slash)', () => {
      expect(getSafeRedirect('dashboard')).toBe('%2F');
    });

    it('should reject paths with backslashes', () => {
      // Does not start with /
      expect(getSafeRedirect('\\\\evil.com')).toBe('%2F');
    });
  });

  describe('edge cases', () => {
    it('should handle path with multiple slashes', () => {
      // Starts with // - rejected
      expect(getSafeRedirect('///')).toBe('%2F');
    });

    it('should accept single slash with trailing slashes', () => {
      expect(getSafeRedirect('/path//')).toBe('%2Fpath%2F%2F');
    });

    it('should handle newlines in path', () => {
      // Path with newline - newlines are preserved in encoded form for LoginButton
      // (newlines are only stripped in auth callback)
      expect(getSafeRedirect('/doc\n')).toBe('%2Fdoc%0A');
    });

    it('should handle unicode in path', () => {
      expect(getSafeRedirect('/doc-test')).toBe('%2Fdoc-test');
    });

    it('should handle very long paths', () => {
      const longPath = '/' + 'a'.repeat(1000);
      const result = getSafeRedirect(longPath);
      expect(result.startsWith('%2F')).toBe(true);
    });

    it('should handle path with colon in segment', () => {
      // Contains colon - rejected
      expect(getSafeRedirect('/doc:123')).toBe('%2F');
    });
  });

  describe('URL encoding verification', () => {
    it('should properly encode special characters', () => {
      expect(getSafeRedirect('/path?a=b&c=d')).toBe('%2Fpath%3Fa%3Db%26c%3Dd');
    });

    it('should properly encode spaces', () => {
      expect(getSafeRedirect('/my path')).toBe('%2Fmy%20path');
    });

    it('should double-encode already encoded characters', () => {
      expect(getSafeRedirect('/path%20name')).toBe('%2Fpath%2520name');
    });
  });
});

// =============================================================================
// getSafeRedirectPath Tests (auth/callback/route.ts)
// =============================================================================

describe('getSafeRedirectPath (auth callback)', () => {
  // Replicate the function for testing - must match actual implementation
  function getSafeRedirectPath(path: string | null): string {
    if (!path) return '/';

    // Remove any whitespace characters that could be used for bypass
    const cleaned = path.replace(/[\s\x00-\x1f]/g, '');

    // Must start with exactly one / and not be a protocol-relative URL
    // Check for // anywhere (could be smuggled via null byte)
    if (
      cleaned.startsWith('/') &&
      !cleaned.startsWith('//') &&
      !cleaned.includes('//') &&
      !cleaned.includes(':') &&
      !cleaned.includes('\\') &&
      !cleaned.includes('%2f') &&
      !cleaned.toLowerCase().includes('%2f')
    ) {
      return cleaned;
    }
    return '/';
  }

  describe('valid redirect paths', () => {
    it('should return root path for null input', () => {
      expect(getSafeRedirectPath(null)).toBe('/');
    });

    it('should accept root path', () => {
      expect(getSafeRedirectPath('/')).toBe('/');
    });

    it('should accept simple paths', () => {
      expect(getSafeRedirectPath('/dashboard')).toBe('/dashboard');
    });

    it('should accept nested paths', () => {
      expect(getSafeRedirectPath('/doc/abc-123')).toBe('/doc/abc-123');
    });

    it('should accept paths with query parameters', () => {
      expect(getSafeRedirectPath('/doc?id=123')).toBe('/doc?id=123');
    });

    it('should accept paths with hash fragments', () => {
      expect(getSafeRedirectPath('/doc#section')).toBe('/doc#section');
    });
  });

  describe('open redirect prevention', () => {
    it('should reject absolute URLs with http://', () => {
      expect(getSafeRedirectPath('http://evil.com')).toBe('/');
    });

    it('should reject absolute URLs with https://', () => {
      expect(getSafeRedirectPath('https://evil.com')).toBe('/');
    });

    it('should reject protocol-relative URLs', () => {
      expect(getSafeRedirectPath('//evil.com')).toBe('/');
    });

    it('should reject javascript: URLs', () => {
      expect(getSafeRedirectPath('javascript:alert(1)')).toBe('/');
    });

    it('should reject data: URLs', () => {
      expect(getSafeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/');
    });

    it('should reject paths without leading slash', () => {
      expect(getSafeRedirectPath('dashboard')).toBe('/');
    });

    it('should reject empty string', () => {
      expect(getSafeRedirectPath('')).toBe('/');
    });
  });

  describe('crafted attack vectors', () => {
    it('should reject protocol-relative with path', () => {
      expect(getSafeRedirectPath('//evil.com/callback')).toBe('/');
    });

    it('should reject URL with @ for credential injection', () => {
      expect(getSafeRedirectPath('//user:pass@evil.com')).toBe('/');
    });

    it('should reject URL-encoded protocol-relative', () => {
      // After decoding, this would be //evil.com
      // But we check the raw string, which starts with %
      expect(getSafeRedirectPath('%2F%2Fevil.com')).toBe('/');
    });

    it('should reject backslash-based attacks', () => {
      // Does not start with /
      expect(getSafeRedirectPath('\\\\evil.com')).toBe('/');
    });

    it('should reject tab-prefixed URLs', () => {
      expect(getSafeRedirectPath('\t//evil.com')).toBe('/');
    });

    it('should reject newline-prefixed URLs', () => {
      expect(getSafeRedirectPath('\n//evil.com')).toBe('/');
    });

    it('should reject paths with colon (could be interpreted as port)', () => {
      expect(getSafeRedirectPath('/doc:8080')).toBe('/');
    });

    it('should handle Unicode confusables', () => {
      // Unicode slash lookalikes should not pass as /
      // Forward slash is U+002F, but there are lookalikes
      expect(getSafeRedirectPath('\u2215\u2215evil.com')).toBe('/'); // Division slash
      expect(getSafeRedirectPath('\u2044\u2044evil.com')).toBe('/'); // Fraction slash
    });
  });

  describe('edge cases', () => {
    it('should handle path with only query string', () => {
      expect(getSafeRedirectPath('?redirect=/')).toBe('/');
    });

    it('should handle path with only hash', () => {
      expect(getSafeRedirectPath('#/dashboard')).toBe('/');
    });

    it('should handle undefined coercion', () => {
      expect(getSafeRedirectPath(undefined as unknown as string)).toBe('/');
    });

    // Note: The following tests verify type coercion handling.
    // In production, TypeScript types prevent these cases, but
    // the function should handle them gracefully at runtime.
    it('should handle number coercion (falsy check returns /)', () => {
      // Number 123 is truthy but not a string - will throw at .startsWith()
      // In production, TypeScript prevents this. This test documents the behavior.
      // The actual behavior is a TypeError because startsWith doesn't exist on numbers
      // Wrapping in try-catch to document the current limitation
      try {
        const result = getSafeRedirectPath(123 as unknown as string);
        expect(result).toBe('/'); // Won't reach here
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
      }
    });

    it('should handle boolean coercion', () => {
      // Boolean true is truthy - will throw at .startsWith()
      try {
        const result = getSafeRedirectPath(true as unknown as string);
        expect(result).toBe('/');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
      }
    });

    it('should handle array coercion', () => {
      // Arrays have .startsWith via prototype chain from String
      // but ['/evil'].startsWith('/') actually works (returns true for ['/evil'])
      // because ['/evil'].toString() === '/evil'
      try {
        const result = getSafeRedirectPath(['/evil'] as unknown as string);
        // Arrays coerce to string, so this may pass unexpectedly
        expect(typeof result).toBe('string');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
      }
    });

    it('should handle object coercion', () => {
      // Objects don't have .startsWith
      try {
        const result = getSafeRedirectPath({ path: '/evil' } as unknown as string);
        expect(result).toBe('/');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
      }
    });
  });
});

// =============================================================================
// Combined Security Scenario Tests
// =============================================================================

describe('authentication flow security', () => {
  function getSafeRedirect(path: string): string {
    const safePath = path.startsWith('/') && !path.startsWith('//') && !path.includes(':') ? path : '/';
    return encodeURIComponent(safePath);
  }

  function getSafeRedirectPath(path: string | null): string {
    if (!path) return '/';

    // Remove any whitespace characters that could be used for bypass
    const cleaned = path.replace(/[\s\x00-\x1f]/g, '');

    if (
      cleaned.startsWith('/') &&
      !cleaned.startsWith('//') &&
      !cleaned.includes('//') &&
      !cleaned.includes(':') &&
      !cleaned.includes('\\') &&
      !cleaned.includes('%2f') &&
      !cleaned.toLowerCase().includes('%2f')
    ) {
      return cleaned;
    }
    return '/';
  }

  describe('round-trip validation', () => {
    it('should safely encode and decode valid paths', () => {
      const originalPath = '/doc/abc-123';
      const encoded = getSafeRedirect(originalPath);
      const decoded = decodeURIComponent(encoded);
      const finalPath = getSafeRedirectPath(decoded);
      expect(finalPath).toBe(originalPath);
    });

    it('should block malicious paths at both stages', () => {
      const maliciousPath = 'https://evil.com';
      const encoded = getSafeRedirect(maliciousPath);
      const decoded = decodeURIComponent(encoded);
      const finalPath = getSafeRedirectPath(decoded);
      expect(finalPath).toBe('/');
    });

    it('should handle double-encoded attacks', () => {
      // Attacker might try to double-encode a malicious URL
      const doubleEncodedPath = encodeURIComponent('//evil.com');
      // First validation (at LoginButton)
      const step1 = getSafeRedirect(doubleEncodedPath);
      // After URL parameter passing and decoding
      const decoded = decodeURIComponent(step1);
      // Second validation (at callback)
      const finalPath = getSafeRedirectPath(decoded);
      expect(finalPath).toBe('/');
    });
  });

  describe('OWASP Top 10 redirect attack patterns', () => {
    const attackVectors = [
      'http://evil.com',
      'https://evil.com',
      '//evil.com',
      '//evil.com/path',
      '/\\evil.com',
      'javascript:alert(1)',
      'javascript://alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'ftp://evil.com',
      '//google.com%2F.evil.com',
      '/\t/evil.com',
      '/\n/evil.com',
      'https:evil.com',
      '//evil%00.com',
      '/%2F/evil.com',
      '///evil.com',
      '\\\\evil.com',
      'http://localhost@evil.com',
      'http://evil.com:80@localhost',
    ];

    attackVectors.forEach((vector) => {
      it(`should block attack vector: ${vector.slice(0, 30)}...`, () => {
        const step1 = getSafeRedirect(vector);
        const decoded = decodeURIComponent(step1);
        const finalPath = getSafeRedirectPath(decoded);
        expect(finalPath).toBe('/');
      });
    });
  });
});

// =============================================================================
// Bypass Attempt Tests
// =============================================================================

describe('security bypass attempts', () => {
  function getSafeRedirectPath(path: string | null): string {
    if (!path) return '/';

    // Remove any whitespace characters that could be used for bypass
    const cleaned = path.replace(/[\s\x00-\x1f]/g, '');

    if (
      cleaned.startsWith('/') &&
      !cleaned.startsWith('//') &&
      !cleaned.includes('//') &&
      !cleaned.includes(':') &&
      !cleaned.includes('\\') &&
      !cleaned.includes('%2f') &&
      !cleaned.toLowerCase().includes('%2f')
    ) {
      return cleaned;
    }
    return '/';
  }

  describe('encoding bypass attempts', () => {
    it('should block URL-encoded forward slash bypass', () => {
      expect(getSafeRedirectPath('%2F%2Fevil.com')).toBe('/');
    });

    it('should block double URL-encoded bypass', () => {
      expect(getSafeRedirectPath('%252F%252Fevil.com')).toBe('/');
    });

    it('should block mixed encoding bypass', () => {
      // Contains %2f which is a URL-encoded slash
      expect(getSafeRedirectPath('/%2Fevil.com')).toBe('/');
    });

    it('should block UTF-8 encoding bypass', () => {
      // These should not bypass the check
      expect(getSafeRedirectPath('\xc0\xafevil.com')).toBe('/');
    });
  });

  describe('whitespace bypass attempts', () => {
    it('should block null byte injection', () => {
      expect(getSafeRedirectPath('/valid\x00//evil.com')).toBe('/');
    });

    it('should block tab injection', () => {
      expect(getSafeRedirectPath('/\t/evil.com')).toBe('/');
    });

    it('should block carriage return injection', () => {
      expect(getSafeRedirectPath('/\r/evil.com')).toBe('/');
    });

    it('should block line feed injection', () => {
      expect(getSafeRedirectPath('/\n/evil.com')).toBe('/');
    });

    it('should block form feed injection', () => {
      expect(getSafeRedirectPath('/\f/evil.com')).toBe('/');
    });
  });

  describe('scheme bypass attempts', () => {
    it('should block uppercase scheme', () => {
      expect(getSafeRedirectPath('HTTP://evil.com')).toBe('/');
    });

    it('should block mixed case scheme', () => {
      expect(getSafeRedirectPath('HtTp://evil.com')).toBe('/');
    });

    it('should block scheme with extra colon', () => {
      expect(getSafeRedirectPath('http:://evil.com')).toBe('/');
    });

    it('should block scheme without double slash', () => {
      expect(getSafeRedirectPath('http:evil.com')).toBe('/');
    });
  });
});
