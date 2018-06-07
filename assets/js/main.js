(function(){
    var currentPage = 0;
    var amountPerPage = 25;
    var fullStories = null;
    var fullStoriesBack = null;
    var totalPages = 1;
    var cachedPageStories = [];

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
        storyTitle.textContent = story.title;
        storyTitle.classList.add('title');

        let storyAuthor = document.createElement('a');
        storyAuthor.textContent = 'Author: ' + story.author;
        storyAuthor.setAttribute('target','_BLANK');
        storyAuthor.setAttribute('href','https://reddit.com/u/' + story.author);
        storyAuthor.classList.add('author','detail');

        let storyDate = document.createElement('span');
        storyDate.textContent = 'Posted ' + moment(datePosted.toLocaleDateString()).fromNow();
        storyDate.classList.add('date','detail');

        let storyLink = document.createElement('a');
        storyLink.textContent = 'Original: ' + story.url;
        storyLink.classList.add('link','detail');
        storyLink.setAttribute('target','_BLANK');
        storyLink.setAttribute('href','https://np.reddit.com' + story.url);

        let returnButton = document.createElement('button');
        returnButton.classList.add('returnButton');
        returnButton.setAttribute('type','button');
        returnButton.textContent = 'Return To Story List';

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
            pageItem.textContent = i+1;
            bindClickEventListener(pageItem,paginationButtonHandler);
            navigatorContainer.appendChild(pageItem);
        }
        document.querySelector('#storyList').appendChild(navigatorContainer);
    }

    function scrollToPosition(y) {
        scrollTo(0,y);
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
            storyTitle.textContent = story.title;

            let storyDate = document.createElement('span');
            storyDate.classList.add('date','detail');
            storyDate.textContent = moment(datePosted.toLocaleDateString()).fromNow();

            let clearFloat = document.createElement('div');
            clearFloat.classList.add('clearFloat');

            storyElement.appendChild(storyTitle);
            storyElement.appendChild(storyDate);
            storyElement.appendChild(storyLink);
            storyElement.appendChild(clearFloat);

            document.querySelector('#storyList').appendChild(storyElement);

            _preCacheStory(story.id);
        });
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
        noResultsFound.textContent = 'No results found';
        workarea.appendChild(noResultsFound);
    }

    function searchHandler(e) {
        let searchVal = e.target.value;
        if(!fullStoriesBack) {
            fullStoriesBack = fullStories;
        }

        clearPage();

        if(searchVal.trim().length > 0) {
            fullStories = fullStoriesBack;
            fullStories = doSearchStory(searchVal);
            
            if(fullStories.length === 0) {
                fullStories = fullStoriesBack;
                fullStoriesBack = null;
                noResultsFound();
            }
        } else {
            fullStories = fullStoriesBack;
        }

        totalPages = Math.floor(fullStories.length/amountPerPage);
        currentPage = 1;
        renderStoryList(loadPage(0));
        buildNav(0);
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
    }

    function singleStoryButtonHandler(e) {
        if(e.button !== 0) return;

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
        },250));
    }

    initialize();
})();
