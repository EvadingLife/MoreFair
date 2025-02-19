import { config, library } from "@fortawesome/fontawesome-svg-core";
// eslint-disable-next-line import/named
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { defineNuxtPlugin } from "nuxt/app";
import { faScroll, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

// This is important, we are going to let Nuxt worry about the CSS
config.autoAddCss = false;

// You can add your icons directly in this plugin. See other examples for how you
// can add other styles or just individual icons.
library.add(faDiscord);
library.add(faShieldHalved);
library.add(faScroll);

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("font-awesome-icon", FontAwesomeIcon);
});
