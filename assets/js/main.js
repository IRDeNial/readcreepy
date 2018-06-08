(function(){
    var currentPage = 0;
    var amountPerPage = 25;
    var fullStories = null;
    var fullStoriesBack = null;
    var totalPages = 1;
    var cachedPageStories = [];
    var currentScrollPos = 0;

    function _dateSort(a,b) {
        let _a = Number(a.time);
        let _b = Number(b.time);
        return _a-_b;
    }

    function _debounce(callback, time) {
        let timeout;
      
        return function() {
            const functionCall = () => callback.apply(this, arguments);
          
            clearTimeout(timeout);
            timeout = setTimeout(functionCall, time);
        }
    }

    function clearSingleStory() {
        let singleStory = document.querySelector('#singleStory .story');
        if(singleStory) {
            singleStory.parentNode.removeChild(singleStory);
        }
    }

    function clearPage() {
        let oldStoryList = document.getElementById('storyList');
        let newStoryList = oldStoryList.cloneNode();
        oldStoryList.parentNode.replaceChild(newStoryList,oldStoryList);
    }

    function doError(message) {
        throw Error(message);
    }

    function buildStoryDOM(story) {
        let storyElement = document.createElement('div');
        storyElement.classList.add('story');
        let datePosted = new Date(parseFloat(story.time));

        let storyTitle = document.createElement('div');
        let storyTitleTextContent = document.createTextNode(story.title);
        storyTitle.appendChild(storyTitleTextContent);
        storyTitle.classList.add('title');

        let storyAuthor = document.createElement('a');
        let storyAuthorTextContent = document.createTextNode('Author: ' + story.author);
        storyAuthor.appendChild(storyAuthorTextContent);
        storyAuthor.setAttribute('target','_BLANK');
        storyAuthor.setAttribute('href','https://reddit.com/u/' + story.author);
        storyAuthor.classList.add('author','detail');

        let storyDate = document.createElement('span');
        let storyDateTextContent = document.createTextNode('Posted: ' + moment(datePosted).fromNow());
        storyDate.appendChild(storyDateTextContent);
        storyDate.classList.add('date','detail');

        let storyLink = document.createElement('a');
        let storyLinkTextContent = document.createTextNode('Original: ' + story.url);
        storyLink.appendChild(storyLinkTextContent);
        storyLink.classList.add('link','detail');
        storyLink.setAttribute('target','_BLANK');
        storyLink.setAttribute('href','https://np.reddit.com' + story.url);

        let returnButton = document.createElement('button');
        returnButton.classList.add('returnButton');
        returnButton.setAttribute('type','button');
        let returnButtonTextContent = document.createTextNode('Return To Story List');
        returnButton.appendChild(returnButtonTextContent);

        let storyContent = document.createElement('div');
        storyContent.classList.add('content');
        storyContent.innerHTML = fixURLs(story.body);

        storyElement.appendChild(storyTitle);
        storyElement.appendChild(storyAuthor);
        storyElement.appendChild(storyDate);
        storyElement.appendChild(storyLink);
        storyElement.appendChild(returnButton);
        storyElement.appendChild(storyContent);
        storyElement.appendChild(returnButton.cloneNode(true));

        document.querySelector('#singleStory').appendChild(storyElement);
    }

    async function loadSingleStory(storyid) {
        let story = cachedPageStories[storyid];
        if(!story) {
            let request = await fetch('/content/' + storyid + '.json');
            story = await request.json();
        }
        
        buildStoryDOM(story);
        
        document.querySelectorAll('.returnButton').forEach((target) => {
            bindClickEventListener(target,returnButtonHandler);
        });

        scrollToPosition(0);
        document.querySelector('#search').classList.add('hidden');
        document.querySelector('#singleStory').classList.remove('hidden');
        document.querySelector('#storyList').classList.add('hidden');
    }

    function loadPage(pageIndex) {
        if(isNaN(pageIndex)) {
            pageIndex = 0;
        } else if(pageIndex > totalPages) {
            pageIndex = totalPages;
        } else if(pageIndex < 0) {
            pageIndex = 0;
        }
        let pageStartIndex = amountPerPage * pageIndex;
        let pageEndIndex = pageStartIndex + amountPerPage;

        return fullStories.slice(pageStartIndex,pageEndIndex);
    }

    async function getStoryIndex() {
        let response = await fetch('/content/index.json');
        let jsonData = await response.json();
        try {
            jsonData = jsonData.stories.sort(_dateSort).reverse();
            fullStories = jsonData;
            totalPages = Math.floor(fullStories.length/amountPerPage);
        } catch(error) {
            doError(error);
        }
    }

    function fixURLs(content) {
        return content.replace(/\"(https?\:)?\/\/((old|www|np)\.)?(reddit\.com\/r\/nosleep\/comments|redd\.it)\/([a-zA-Z0-9]+)(.*?)\>/gim,'"/story/$5">Link:&nbsp;');
    }

    function setNavStory(storyID) {
        history.pushState(null,null,'story/' + storyID);
        _preCacheClear();
    }
    
    function setNavPage(pageID) {
        if(isNaN(pageID)) {
            pageID = 1;
        } else if(pageID < 1) {
            pageID = 1;
        } else if(pageID > totalPages) {
            pageID = totalPages;
        }
        history.pushState(null,null,'page/' + pageID);
        _preCacheClear();
    }

    function isPathStory() {
        return !!(window.location.pathname.match(/\/story\/(.*)/i));
    }
    
    function isPathPage() {
        return !!(window.location.pathname.match(/\/page\/(.*)/i));
    }

    function buildNav(activePage) {
        if(isNaN(activePage)) {
            activePage = 0;
        } else if(activePage > (totalPages)) {
            activePage = totalPages;
        } else if(activePage < 0) {
            activePage = 0;
        }

        let navigatorContainer = document.createElement('div');
        navigatorContainer.classList.add('navigation');
        for(let i = 0;i <= totalPages;++i) {
            let pageItem = document.createElement('div');
            pageItem.classList.add('page');
            if(activePage == i) {
                pageItem.classList.add('active');
            }
            pageItem.dataset.page = i;
            let pageItemText = document.createTextNode(i+1);
            pageItem.appendChild(pageItemText);
            bindClickEventListener(pageItem,paginationButtonHandler);
            navigatorContainer.appendChild(pageItem);
        }
        document.querySelector('#storyList').appendChild(navigatorContainer);
    }

    function scrollToPosition(y) {
        scrollTo(0,y);
    }
    function scrollSetPosition(y) {
        currentScrollPos = y;
    }

    async function _preCacheStory(storyID) {
        let response = await fetch('/content/' + storyID + '.json');
        let jsonData = await response.json();
        if(response.ok) {
            cachedPageStories[storyID] = jsonData;
        }
    }

    function _preCacheClear() {
        cachedPageStories = [];
    }

    function renderStoryList(stories) {
        clearSingleStory();

        let searchBarInput = document.querySelector('#search .searchInput');
        let searchBar = document.querySelector('#search');
        stories.forEach((story) => {
            let storyElement = document.createElement('div');
            storyElement.classList.add('story');
            let datePosted = new Date(parseFloat(story.time));

            let storyLink = document.createElement('a');
            storyLink.setAttribute('href','/story/'+story.id);
            storyLink.classList.add('storyLink');
            storyLink.dataset.storyid = story.id;
            bindClickEventListener(storyLink,singleStoryButtonHandler);

            let storyTitle = document.createElement('div');
            storyTitle.classList.add('title');
            let storyTitleTextContent = document.createTextNode(story.title);
            storyTitle.appendChild(storyTitleTextContent);

            let storyDate = document.createElement('span');
            storyDate.classList.add('date','detail');
            let storyDateTextContent = document.createTextNode(moment(datePosted).fromNow());
            storyDate.appendChild(storyDateTextContent);

            let clearFloat = document.createElement('div');
            clearFloat.classList.add('clearFloat');

            storyElement.appendChild(storyTitle);
            storyElement.appendChild(storyDate);
            storyElement.appendChild(storyLink);
            storyElement.appendChild(clearFloat);

            document.querySelector('#storyList').appendChild(storyElement);

            _preCacheStory(story.id);
        });

        if(searchBarInput.val != '') {
            searchBar.classList.remove('hidden');
        }
    }

    function doSearchStory(searchParams) {
        searchParams = searchParams.toLowerCase();
        return fullStories.filter((story) => {
            if(story.title && story.title.toLowerCase().includes(searchParams)) {
                return true;
            } else if(story.author && story.author.toLowerCase().includes(searchParams)) {
                return true;
            } else {
                return false;
            }
        });
    }

    function noResultsFound() {
        let workarea = document.querySelector('#storyList');
        let noResultsFound = document.createElement('h1');
        let noResultsFoundTextContent = document.createTextNode('No Results Found');
        noResultsFound.appendChild(noResultsFoundTextContent);
        workarea.appendChild(noResultsFound);
    }

    function searchHandler(e) {
        let searchVal = e.target.value;
        if(!fullStoriesBack) {
            fullStoriesBack = fullStories;
        }

        clearPage();

        if(searchVal.trim().length) {
            fullStories = fullStoriesBack;
            fullStories = doSearchStory(searchVal);
            
            if(fullStories.length === 0) {
                noResultsFound();
            }
        } else {
            fullStories = fullStoriesBack;
        }

        totalPages = Math.floor(fullStories.length/amountPerPage);
        currentPage = 1;
        if(fullStories.length) {
            renderStoryList(loadPage(0));
            buildNav(0);
        }
        setNavPage(1);
    }

    function returnButtonHandler(e) {
        if(e.button !== 0) return;

        document.querySelector('#singleStory').classList.add('hidden');
        document.querySelector('#storyList').classList.remove('hidden');
        clearPage();
        renderStoryList(loadPage(currentPage));
        buildNav(currentPage);
        setNavPage(currentPage+1);

        scrollToPosition(currentScrollPos);
    }

    function singleStoryButtonHandler(e) {
        if(e.button !== 0) return;
        scrollSetPosition(window.scrollY);

        loadSingleStory(e.target.dataset.storyid);
        setNavStory(e.target.dataset.storyid);
    }

    function preventDefaultHandler(e) {
        if(e.button !== 0) return;

        e.preventDefault();
    }

    function paginationButtonHandler(e) {
        if(e.button !== 0) return;

        clearPage();

        renderStoryList(loadPage(e.target.dataset.page));
        currentPage = parseInt(e.target.dataset.page);
        buildNav(e.target.dataset.page);
        setNavPage(parseInt(e.target.dataset.page,10)+1);
        scrollToPosition(0);
    }

    function bindClickEventListener(target,functionName) {
        target.addEventListener('mousedown',functionName);
        target.addEventListener('touchstart',functionName);
        target.addEventListener('click',preventDefaultHandler);
    }

    async function initialize() {
        if (!('fetch' in window)) {
            doError("Invalid environment.  Try a different browser.");
            return false;
        }

        await getStoryIndex();

        if(isPathStory()) {
            let storyID = window.location.pathname.match(/\/story\/(.*)/i)[1];
            loadSingleStory(storyID);
        } else if(isPathPage()) {
            let page = window.location.pathname.match(/\/page\/(.*)/i)[1];
            renderStoryList(loadPage(page-1));
            buildNav(page-1)
        } else {
            renderStoryList(loadPage(0));
            buildNav(0);
        }

        scrollToPosition(0);

        document.querySelector('#search .searchInput').addEventListener('keydown',_debounce((e) => {
            searchHandler(e);
        },100));

        document.querySelector('.headerHomeNav').addEventListener('mousedown',(e) => {
            if(fullStoriesBack) {
                fullStories = fullStoriesBack;
                fullStoriesBack = null;
            }
            clearPage();
            document.querySelector('#singleStory').classList.add('hidden');
            document.querySelector('#storyList').classList.remove('hidden');
            document.querySelector('#search .searchInput').value = '';
            renderStoryList(loadPage(0));
            buildNav(0);
            setNavPage(1);
        });

        document.querySelector('.headerNav .search').addEventListener('mousedown',(e) => {
            let searchBar = document.querySelector('#search');

            if(searchBar.classList.contains('hidden')) {
                searchBar.classList.remove('hidden');
            } else {
                searchBar.classList.add('hidden');
            }
        });
    }

    initialize();
    console.log("%c\uD83D\uDC7B\u0020\u0042\u004f\u004f", "color:#fefefe;font-size:10em;background-color:#323232;padding:25px;font-family:'Special Elite', cursive;");
    console.log("%cSorry, did I scare you?  Feel free to poke around.\nThere isn't much to do here though.", "color: black; font-size: 2em");
})();
