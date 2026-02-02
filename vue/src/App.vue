<template>
    <div>

        <!-- Search modal -->
        <div id="searchModal" ref="searchModal" tabindex="-1" aria-hidden="true"
            class="hidden overflow-hidden fixed top-0 right-0 left-0 z-50  md:inset-0 h-modal md:h-full">
            <div class="relative p-4 w-search max-w-2xl h-full md:max-h-screen overflow-hidden">
                <!-- Modal content -->
                <div class="relative bg-white rounded-lg shadow dark:bg-gray-700 overflow-y-auto h-full">
                    <!-- Modal header -->
                    <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
                        <h3 class="w-full text-xl font-semibold text-gray-900 dark:text-white mr-4">
                            <form @submit.prevent="searchLists" class="w-full">
                                <label for="searchModalInput"
                                    class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300">Search
                                    Languages</label>
                                <div class="relative">
                                    <div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                                        <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </div>
                                    <input v-model="state.searchQuery" type="search" id="searchModalInput"
                                        class="block p-4 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="Search Languages" required>
                                    <button type="submit"
                                        class="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
                                </div>
                            </form>
                        </h3>
                        <button type="button"
                            class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                            @click="state.modal.toggle">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clip-rule="evenodd"></path>
                            </svg>
                            <span class="sr-only">Close modal</span>
                        </button>
                    </div>
                    <!-- Modal body -->
                    <div class="p-6 space-y-6">
                        <div class="flex flex-col w-full gap-3 z-10">
                            <div v-for="item in state.languages" :key="item.id"
                                class="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    {{item.name}}
                                </h5>
                                <button @click="selectLanguage(item); state.modal.hide()"
                                    class="inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                    Select language
                                    <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4" fill="currentColor"
                                        viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd"
                                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                            clip-rule="evenodd"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-img relative min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-gray-500 bg-no-repeat bg-cover bg-center relative items-center"
            :style="`background-image: url(${manifest.background});`">
            <div class="absolute bg-black opacity-60 inset-0 z-0"></div>
            <div class="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-xl z-10">


                <div class="grid gap-8 grid-cols-1">
                    <div class="flex flex-col ">
                        <div class="items-center header">
                            <img class="logo" :src="manifest.logo">
                            <h1 class="font-semibold text-lg mr-auto">{{ manifest.name }}</h1>
                            <h2 class="font-semibold text-lg mr-auto" style="text-align: right;">Version: {{
                            manifest.version }}</h2>
                            <p class="mt-5">{{ manifest.description }}</p>
                        </div>

                        <div class="flex items-center justify-center space-x-2 mt-5">
                            <span class="h-px w-full bg-gray-200"></span>
                        </div>

                        <div class="items-center mt-5 description">
                            <h2 class="font-semibold text-lg mr-auto">Features:</h2>
                            <ul class="ml-4 mt-2 space-y-1 text-sm">
                                <li>✓ Subtitles from OpenSubtitles.org</li>
                                <li>✓ MovieHash matching</li>
                                <li>✓ Auto Adjustment sync</li>
                            </ul>
                        </div>

                        <div class="flex items-center justify-center space-x-2 mt-10">
                            <span class="h-px w-full bg-gray-200"></span>
                        </div>

                        <!-- Options -->
                        <div class="mt-5">
                            <h3 class="font-semibold text-md mr-auto mb-3">Options:</h3>

                            <!-- MovieHash + Auto Adjustment -->
                            <div class="flex items-center mb-3">
                                <input id="moviehash-auto" type="checkbox" v-model="state.options.movieHashAuto"
                                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                <label for="moviehash-auto" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    MovieHash + Auto Adjustment
                                </label>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 ml-8 mb-3">
                                Uses movie hash to find exact subtitles, otherwise auto-syncs them
                            </p>

                            <!-- Only Trusted Uploaders -->
                            <div class="flex items-center mb-3">
                                <input id="trusted" type="checkbox" v-model="state.options.trustedOnly"
                                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                <label for="trusted" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Only Trusted Uploaders
                                </label>
                            </div>

                            <!-- AI Translated -->
                            <div class="flex items-center mb-3">
                                <input id="ai" type="checkbox" v-model="state.options.aiTranslated"
                                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                <label for="ai" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Include AI Translated
                                </label>
                            </div>
                        </div>

                        <div class="flex items-center justify-center space-x-2 mt-10">
                            <span class="h-px w-full bg-gray-200"></span>
                        </div>

                        <div class="mt-5">
                            <form @submit.prevent="searchLists">
                                <label for="searchInput"
                                    class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300">Search
                                    Language</label>
                                <div class="relative">
                                    <div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                                        <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </div>
                                    <input v-model="state.searchQuery" type="search" id="searchInput"
                                        class="block p-4 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="Search Languages" required>
                                    <button type="submit"
                                        class="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
                                </div>
                            </form>

                        </div>

                        <div class="flex items-center justify-center space-x-2 mt-10">
                            <span class="h-px w-full bg-gray-200"></span>
                        </div>

                        <div class="items-center mt-5 description">
                            <h2 class="font-semibold text-lg mr-auto">Selected language:</h2>
                            <br>
                            <h3>{{ state.Language.name ? state.Language.name : 'None' }}</h3>
                        </div>

                    <div class="flex items-center justify-center space-x-2 mt-10">
                        <span class="h-px w-full bg-gray-200"></span>
                    </div>

                    <div class="mt-10 flex flex-col">
                        <a  id="install_button" href="#"
                        class="text-white font-medium rounded-lg text-sm text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        <button :disabled='state.isDisabled' type="button"
                            class="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Install
                            Addon</button></a>
                    </div>


                    <div class="mt-5 flex flex-col">
                        <p class="text-center text-gray-400">This addon was created by:
                            <a href="https://github.com/dexter21767" target="_blank"
                                class="text-purple-700">dexter21767</a><br />
                            UI by:
                            <a href="https://github.com/rleroi" target="_blank" class="text-purple-700">rab1t</a><br />
                            Modified with MovieHash + Auto Adjustment support
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue';
import Modal from 'flowbite/src/components/modal';
import { useHead } from "@vueuse/head";
import * as manifest from '../../manifest.json';
import * as langs from '../../languages.json';
const languages = langs.default 

const stylizedTypes = manifest.types.map(t => t[0].toUpperCase() + t.slice(1));

useHead({
    title: manifest.name + ' - Stremio Addon',
    link: [
        {
            rel: "icon",
            type: "image/svg+xml",
            href: "//static.opensubtitles.org/favicon.ico",
        }
    ],
})

const state = reactive({
    languages: [],
    searchQuery: '',
    modal: null,
    install: null,
    Language: {},
    isDisabled: true,
    options: {
        movieHashAuto: false,
        trustedOnly: false,
        aiTranslated: false
    }
});

const searchModal = ref();

onMounted(() => {
    state.modal = new Modal(searchModal.value);
});

// Regenerate URL when options change
watch(() => state.options, () => {
    if (state.Language.id) {
        generateInstallUrl();
    }
}, { deep: true });

function generateInstallUrl() {
    console.log(state.Language.id, state.Language.name);

    // Build configuration string (path part)
    let configuration = state.Language.id || '';

    // Build query parameters
    const params = new URLSearchParams();
    if (state.options.movieHashAuto) {
        params.set('hash', 'auto');
        params.set('auto', '1');
    }
    if (state.options.trustedOnly) {
        params.set('trusted', '1');
    }
    if (state.options.aiTranslated) {
        params.set('ai', '1');
    }

    // Build the full URL
    const baseLocation = window.location.host;
    const queryString = params.toString();

    let location;
    if (queryString) {
        location = `${baseLocation}/${configuration}/manifest.json?${queryString}`;
    } else {
        location = `${baseLocation}/${configuration}/manifest.json`;
    }

    document.getElementById("install_button").href = 'stremio://' + location;
    console.log('location', location);
}

async function searchLists() {
    state.modal.show();
    state.languages = filtered(languages, 'name', state.searchQuery)
}

function selectLanguage(lang) {
    state.Language = {
        id: lang.id,
        name: lang.name
    };
    state.isDisabled = false;
    generateInstallUrl()
}

function filtered(list, key, value) {
    var filtered = [], i = Object.keys(list).length;
    var reg = new RegExp(value.toLowerCase(), 'i');
    while (i--) {
        let val = list[Object.keys(list)[i]][key].toLowerCase();
        let test =reg.test(val); 
        if (test) {
            filtered.push(list[Object.keys(list)[i]]);
        }
    }
    return filtered;
};

</script>


<style scoped>
h1 {
    font-weight: bold;
    font-size: x-large;
    text-align: center;
    color: #225C7D;
    padding-top: 10px;
}

.logo {
    margin: auto;
    max-width: 200px;
}

.grabbable {
    cursor: move;
    /* fallback if grab cursor is unsupported */
    cursor: grab;
    cursor: -moz-grab;
    cursor: -webkit-grab;
}

/* (Optional) Apply a "closed-hand" cursor during drag operation. */
.grabbable:active {
    cursor: grabbing;
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
}

.bg-img {
    background: fixed;
    background-size: cover;
    background-position: center center;
    background-repeat: repeat-y;
}

.w-search {
    width: auto;
}

/* width */
::-webkit-scrollbar {
    width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
    background: #f1f1f1;
}

/* Handle */
::-webkit-scrollbar-thumb {
    background: rgb(26 86 219 / var(--tw-bg-opacity));
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
    background: #225C7D;
}
</style>
