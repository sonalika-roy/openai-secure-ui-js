import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { styleMap } from 'lit/directives/style-map.js';
import personSvg from '../../assets/icons/person.svg?raw';
import logoutSvg from '../../assets/icons/logout.svg?raw';
import microsoftSvg from '../../assets/providers/microsoft.svg?inline';
import githubSvg from '../../assets/providers/github.svg?inline';

const loginRoute = '/.auth/login';
const logoutRoute = '/.auth/logout';
const userDetailsRoute = '/.auth/me';

export type AuthDetails = {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
  claims: { typ: string, val: string }[];
};

export type AuthOptions = {
  strings: {
    loginButton: string;
    logoutButton: string;
  }
  providers: AuthProvider[];
};

export type AuthProvider = {
  id: string;
  label: string;
  icon: string;
  color: string;
  textColor: string;
};

export const defaultOptions: AuthOptions = {
  strings: {
    loginButton: 'Log in',
    logoutButton: 'Log out'
  },
  providers: [
    { id: 'aad', label: 'Sign in with Microsoft', icon: microsoftSvg, color: '#00A4EF', textColor: '#fff' },
    { id: 'github', label: 'Sign in with GitHub', icon: githubSvg, color: '#181717', textColor: '#fff' },
    { id: 'google', label: 'Sign in with Google', icon: 'https://cdn.simpleicons.org/google/white', color: '#4285f4', textColor: '#fff' },
    { id: 'facebook', label: 'Sign in with Facebook', icon: 'https://cdn.simpleicons.org/facebook/white', color: '#0866ff', textColor: '#fff' },
    { id: 'apple', label: 'Sign in with Apple', icon: 'https://cdn.simpleicons.org/apple/white', color: '#000', textColor: '#fff' },
    { id: 'twitter', label: 'Sign in with X', icon: 'https://cdn.simpleicons.org/x/white', color: '#000', textColor: '#fff' },
    { id: 'oidc', label: 'Sign in with OpenID Connect', icon: 'https://cdn.simpleicons.org/openid/white', color: '#333', textColor: '#fff' },
  ]
}

export type AuthButtonType = 'status' | 'login' | 'logout';

@customElement('azc-auth')
export class AuthComponent extends LitElement {

  @property({
    type: Object,
    converter: (value) => ({ ...defaultOptions, ...JSON.parse(value || '{}') }),
  })
  options: AuthOptions = defaultOptions;
  // @property({ type: Array }) providers: string[] = ['aad', 'github'];
  @property() type: AuthButtonType = 'login';
  @property() loginRedirect = '/';
  @property() logoutRedirect = '/';
  @state() protected _userDetails: AuthDetails | undefined;
  @state() protected loaded: boolean = false;

  get userDetails() {
    return this._userDetails;
  }

  constructor() {
    super();
    this.getUserInfo().then(userDetails => {
      this._userDetails = userDetails;
      this.loaded = true;
    });
  }

  onLoginClicked(provider: string) {
    const redirect = `${loginRoute}/${provider}?post_login_redirect_uri=${encodeURIComponent(this.loginRedirect)}`;
    window.location.href = redirect;
  }

  onLogoutClicked() {
    const redirect = `${logoutRoute}?post_logout_redirect_uri=${encodeURIComponent(this.logoutRedirect)}`;
    window.location.href = redirect;
  }

  protected async getUserInfo() {
    const response = await fetch(userDetailsRoute);
    const payload = await response.json();
    return payload?.clientPrincipal;
  }

  protected renderStatus = () => html`<section class="auth-status">
    <span class="login-icon">${unsafeSVG(personSvg)}</span>
    ${this._userDetails ? html`<p>Logged in as ${this._userDetails.userDetails}</p>
      <button @click=${() => this.onLogoutClicked()}>Logout</button>` : nothing}
  </section>`;

  protected renderLogin = () => 
    this.userDetails ? html`<slot></slot>` :
  html`<section class="auth-login">
    ${this.options.providers.map(provider => {
      const providerStyle = {
        backgroundColor: provider.color,
        color: provider.textColor
      };
      return html`<button class="login" @click=${() => this.onLoginClicked(provider.id) } style=${styleMap(providerStyle)}>
      <img src="${provider.icon}" alt=""/>
      <span>${provider.label}</span>
    </button>` }
    )}
  </section>`;

  protected renderLogout = () => html`<button class="logout" @click=${() => this.onLogoutClicked()} title="log out">${unsafeSVG(logoutSvg)}</button>`;

  protected override render() {
    switch (this.type) {
      case 'status':
        return this.renderStatus();
      case 'logout':
        return this.renderLogout();
      default:
        return this.renderLogin();
    }
  }

  static override styles = css`
    :host {
      /* Base properties */
      --primary: var(--azc-primary, #07f);
      --error: var(--azc-error, #e30);
      --text-color: var(--azc-text-color, #000);
      --text-invert-color: var(--azc--text-invert-color, #fff);
      --disabled-color: var(--azc-disabled-color, #ccc);
      --bg: var(--azc-bg, #eee);
      --space-md: var(--azc-space-md, 12px);
      --space-xl: var(--azc-space-xl, calc(var(--space-md) * 2));
      --space-xs: var(--azc-space-xs, calc(var(--space-md) / 2));
      --space-xxs: var(--azc-space-xs, calc(var(--space-md) / 4));
      --border-radius: var(--azc-border-radius, 16px);
      --focus-outline: var(--azc-focus-outline, 2px solid);
      --overlay-color: var(--azc-overlay-color, rgba(0 0 0 / 40%));
    }
    *:focus-visible {
      outline: var(--focus-outline) var(--primary);
    }
    .animation {
      animation: 0.3s ease;
    }
    svg {
      fill: currentColor;
      width: 100%;
    }
    button {
      font-size: 1rem;
      border-radius: calc(var(--border-radius) / 2);
      outline: var(--focus-outline) transparent;
      transition: outline 0.3s ease;

      &:not(:disabled) {
        cursor: pointer;
      }
    }
    button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xs) var(--space-md);
      border: var(--button-border);
      background: var(--button-bg);
      color: var(--button-color);
      &:disabled {
        color: var(--disabled-color);
      }
      &:hover:not(:disabled) {
        background: var(--button-bg-hover);
      }
    }
    .auth-status {
      display: flex;
      gap: var(--space-md);
      align-items: center;
    }
    .auth-login {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      align-items: center;
    }
    .login {
      width: 100%;
      justify-content: left;
      gap: var(--space-md);
      
      img {
        width: 24px;
        height: 24px;
      }
    }
  `;
}