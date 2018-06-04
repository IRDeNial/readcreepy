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

    const validateEnvironment = () => {
        if (!('fetch' in window)) return false;
        return true;
    };

    const clearSingleStory = () => {
        let singleStory = document.querySelector('#singleStory .story');
        if(singleStory) {
            singleStory.parentNode.removeChild(singleStory);
        }
    };

    const clearPage = () => {
        document.querySelector('#storyList').innerHTML = '';
    };

    const doError = (message) => {
        //alert(message);
        throw Error(message);
    };

    const loadSingleStory = (storyid) => {
        return fetch('content/' + storyid + '.json',{
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        }).then((response) => {
            return response.json();
        }).catch((error) => {
            doError(error);
        }).then((story) => {
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
        let pageStartIndex = amountPerPage * pageIndex;
        let pageEndIndex = amountPerPage * pageIndex + amountPerPage;

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
        }).catch((error) => {
            doError(error);
        }).then((response) => {
            return response.stories.sort(_dateSort).reverse();
        }).then((response) => {
            fullStories = response;
            totalPages = Math.floor((fullStories.length/amountPerPage));
        });
    };

    const fixURLs = (content) => {
        return content.replace(/\"(https?\:)?\/\/((old|www|np)\.)?(reddit\.com\/r\/nosleep\/comments|redd\.it)\/([a-zA-Z0-9]+)(.*?)\>/gim,'"#$5">Link:&nbsp;');
    };

    const setNavStory = (storyID) => {
        history.pushState(null,null,'story/' + storyID)
    };
    const setNavPage = (pageID) => {
        history.pushState(null,null,'page/' + pageID)
    };
    const isPathStory = () => {
        return !!(window.location.pathname.match(/\/story\/(.*)/i));
    };
    const isPathPage = () => {
        return !!(window.location.pathname.match(/\/page\/(.*)/i));
    };
    const isValidPath = () => {
        return !!(window.location.pathname.match(/\/(page|story)\/(.*)/i));
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
        let navigatorContainer = document.createElement('div');
        navigatorContainer.classList.add('navigation');
        for(let i = 0;i <= parseInt((fullStories.length+1)/amountPerPage,10);++i) {
            navigatorContainer.innerHTML += `<div class="page${(activePage == i ? ' active' : '')}" data-page="${i}">${(i + 1)}</div>`;
        }
        document.querySelector('#storyList').appendChild(navigatorContainer);
        setNavPage(parseInt(activePage,10)+1);
    };

    const scrollToPosition = (y) => {
        scrollTo(0,y);
    };

    const renderStoryList = (stories) => {
        for(let story of stories) {
            let storyElement = document.createElement('div');
            storyElement.classList.add('story');
            let datePosted = new Date(parseFloat(story.time));

            storyElement.innerHTML = `
                <a href="/story/${story.id}" class="storyLink" data-storyid="${story.id}"></a>
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

    const historyFix = (e) => {
        window.location.reload(true);
    };

    const returnButtonHandler = (e) => {
        if(e.button != 0) return;
        if(e.target && e.target.classList.contains('returnButton')) {
            e.preventDefault();
            document.querySelector('#singleStory').classList.add('hidden');
            document.querySelector('#storyList').classList.remove('hidden');
            clearPage();
            renderStoryList(loadPage(currentPage));
            buildNav(currentPage);
        }
    };

    const singleStoryButtonHandler = (e) => {
        if(e.button != 0) return;
        if(e.target && e.target.classList.contains('storyLink')) {
            e.preventDefault();
            loadSingleStory(e.target.dataset.storyid);
        }
    };

    const preventDefaultHandler = (e) => {
        if(e.button != 0) return;
        e.preventDefault();
    };

    const paginationButtonHandler = (e) => {
        if(e.which != 1) return;
        if(e.target && e.target.classList.contains('page')) {
            e.preventDefault();
            clearPage();
            renderStoryList(loadPage(e.target.dataset.page));
            currentPage = e.target.dataset.page;
            buildNav(e.target.dataset.page);
            scrollToPosition(0);
        }
    };

    const bindClickEventListener = (functionName) => {
        document.addEventListener('mousedown',functionName);
        document.addEventListener('touchstart',functionName);
        document.addEventListener('click',preventDefaultHandler);
    };

    const eventListeners = () => {
        bindClickEventListener(singleStoryButtonHandler);
        bindClickEventListener(returnButtonHandler);
        bindClickEventListener(paginationButtonHandler);
        window.onpopstate = historyFix;
    };

    if(!validateEnvironment()) {
        throw Error("Invalid environment. Try a different browser");
    }

    getStoryIndex().then((stories) => {
        if(isValidPath()) {
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
        } else {
            renderStoryList(loadPage(0));
            buildNav(0);
        }

        eventListeners();
        scrollToPosition(0);
    });
})();
