(function(){
    var currentPage = 0;
    var amountPerPage = 25;
    var fullStories = null;
    var totalPages = 1;

    const _dateSort = (a,b) => {
        let _a = Number(a.time);
        let _b = Number(b.time);
        return _a-_b;
    };

    const loadingAnimation = (display) => {
        if(display) {
            document.querySelector('#loader').classList.remove('hidden');
        } else {
            document.querySelector('#loader').classList.add('hidden');
        }
    };

    const validateEnvironment = () => {
        if (!('fetch' in window)) return false;
        return true;
    };

    const clearSingleStory = () => {
        let singleStory = document.querySelector('#singleStory .story');
        if(singleStory) {
            document.querySelector('#singleStory').removeChild(singleStory);
        }
    };

    const clearPage = () => {
        document.querySelector('#storyList').innerHTML = '';
    };

    const doError = (message) => {
        alert(message);
        throw Error(message);
    }

    const loadSingleStory = (storyid) => {
        return fetch('content/' + storyid + '.json',{
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        }).then((response) => {
            return response.json();
        }).catch((error) => { doError(error); }).then((story) => {
            clearSingleStory();

            let storyElement = document.createElement('div');
            storyElement.classList.add('story');
            let datePosted = new Date(parseFloat(story.time));

            storyElement.innerHTML = `
                <div class="row">
                    <div class="col-xs-12 textCenter">
                        <div class="title">${story.title}</div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12 textCenter">
                        <span class="author detail">Author: ${story.author}</span>
                        <span class="detail">&nbsp;|&nbsp;</span>
                        <span class="date detail">Date: ${datePosted.toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12 textCenter">
                        <a class="link detail" target="_BLANK" href="https://np.reddit.com${story.url}">Original:&nbsp;${story.url}</a>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <button class="returnButton" type="button">Return To Story List</button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="content">${fixURLs(story.body)}</div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <button class="returnButton" type="button">Return To Story List</button>
                    </div>
                </div>
            `;
            document.querySelector('#singleStory').appendChild(storyElement);
            setNavStory(story.id);
            loadingAnimation(false);
        }).then(() => {
            scrollToPosition(0);
            document.querySelector('#singleStory').classList.remove('hidden');
            document.querySelector('#storyList').classList.add('hidden');
        });
    };

    const loadPage = (pageIndex) => {
        if(isNaN(pageIndex)) {
            pageIndex = 0;
        }
        if(pageIndex > totalPages) {
            pageIndex = totalPages;
        }
        if(pageIndex < 0) {
            pageIndex = 0;
        }
        var pageStartIndex = amountPerPage * pageIndex;
        var pageEndIndex = amountPerPage * pageIndex + amountPerPage;

        return fullStories.slice(pageStartIndex,pageEndIndex);
    };

    const getStoryIndex = () => {
        return fetch('content/index.json',{
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        }).then((response) => {
            return response.json();
        }).catch((error) => { doError(error); }).then((response) => {
            return response.stories.sort(_dateSort).reverse();
        }).then((response) => {
            fullStories = response;
            totalPages = Math.floor((fullStories.length/amountPerPage));
        });
    };

    const fixURLs = (content) => {
        content = content.replace(/\"(https?\:)?\/\/((old|www|np)\.)?(reddit\.com\/r\/nosleep\/comments|redd\.it)\/([a-zA-Z0-9]+)(.*?)\>/gim,'"#$5">Link:&nbsp;');
        return content;
    };

    const setNavPage = (pageID) => {
        //if(isNaN(pageID)) {
        //    pageID = 1;
        //}
        if(pageID < 1) {
            pageID = 1;
        }
        if(pageID > totalPages) {
            pageID = totalPages+1;
        }
        window.location.hash = '/page/' + pageID;
    };
    const setNavStory = (storyID) => {
        window.location.hash = '/story/' + storyID;
    };

    const isHashStory = () => {
        return !!(window.location.hash.substr(1).match(/\/story\/(.*)/i));
    };
    const isHashPage = () => {
        return !!(window.location.hash.substr(1).match(/\/page\/(.*)/i));
    };

    const isValidHash = () => {
        return !!(window.location.hash.substr(1).match(/\/(page|story)\/(.*)/i));
    };

    const buildNav = (activePage) => {
        if(isNaN(activePage)) {
            activePage = 0;
        }
        if(activePage > (totalPages)) {
            activePage = totalPages;
        }
        if(activePage < 0) {
            activePage = 0;
        }
        var navigatorContainer = document.createElement('div');
        navigatorContainer.classList.add('navigation');
        for(var i = 0;i <= parseInt((fullStories.length+1)/amountPerPage,10);++i) {
            navigatorContainer.innerHTML += `<div class="page${(activePage == i ? ' active' : '')}" data-page="${i}">${(i + 1)}</div>`;
        }
        document.querySelector('#storyList').appendChild(navigatorContainer);
        loadingAnimation(false);
        setNavPage(parseInt(activePage,10)+1);
    };

    const returnButtonHandler = (e) => {
        if(e.target && e.target.classList.contains('returnButton')) {
            document.querySelector('#singleStory').classList.add('hidden');
            document.querySelector('#storyList').classList.remove('hidden');
            scrollToPosition(0);
        }
    };

    const singleStoryButtonHandler = (e) => {
        if(e.target && e.target.classList.contains('storyLink')) {
            loadSingleStory(e.target.dataset.storyid);
        }
    };

    const scrollToPosition = (y) => {
        scrollTo(0,y);
    };

    const renderStoryList = (stories) => {
        for(story of stories) {
            let storyElement = document.createElement('div');
            storyElement.classList.add('story');
            let datePosted = new Date(parseFloat(story.time));

            storyElement.innerHTML = `
                <a href="#${story.id}" class="storyLink" data-storyid="${story.id}"></a>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="title">${story.title}</div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <span class="author detail">Author: ${story.author}</span>
                        <span class="detail">&nbsp;|&nbsp;</span>
                        <span class="date detail">Date: ${datePosted.toLocaleDateString()}</span>
                    </div>
                </div>
            `;

            document.querySelector('#storyList').appendChild(storyElement);
        }
    };

    const paginationButtonHandler = (e) => {
        if(e.target && e.target.classList.contains('page')) {
            loadingAnimation(true);
            clearPage();
            renderStoryList(loadPage(e.target.dataset.page));
            currentPage = e.target.dataset.page;
            buildNav(e.target.dataset.page);
            scrollToPosition(0);
        }
    };

    const singleStoryHashChangeHandler = () => {
        if(isValidHash() && isHashStory()) {
            loadSingleStory(window.location.hash.substr(1).match(/\/story\/(.*)/i)[1]);
        }
    };

    const eventListeners = () => {
        document.addEventListener('click',singleStoryButtonHandler);
        document.addEventListener('click',returnButtonHandler);
        document.addEventListener('click',paginationButtonHandler);
        window.onhashchange = singleStoryHashChangeHandler;
    };

    if(!validateEnvironment()) {
        throw Error("Invalid environment. Try a different browser");
    }

    loadingAnimation(true);

    getStoryIndex().then((stories) => {
        if(isValidHash()) {
            if(isHashStory()) {
                let storyID = window.location.hash.substr(1).match(/\/story\/(.*)/i)[1];
                renderStoryList(loadPage(0));
                buildNav(0);
                loadSingleStory(storyID);
            } else if(isHashPage()) {
                let page = window.location.hash.substr(1).match(/\/page\/(.*)/i)[1];
                renderStoryList(loadPage(page-1));
                buildNav(page-1)
            } else {
                renderStoryList(loadPage(0));
                buildNav(0);
            }
        } else {
            renderStoryList(loadPage(0));
            buildNav(0);
        }

        eventListeners();
        scrollToPosition(0);
    });
    
})();
